"""SupportIQ backend — FastAPI entrypoint.

Pipeline for /tickets/{id}/resolve:
    ticket -> similarity -> decision -> order context -> guardrails -> reply -> log
"""
from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import database
from models.schemas import DecisionLogOut, DecisionResponse, OverrideRequest
from services import decision_engine
from services.reply_generator import generate_reply

DATA_DIR = Path(__file__).resolve().parent / "data"

app = FastAPI(title="SupportIQ", description="Evidence-Based AI Support Ticket Resolution System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

new_tickets_df = pd.read_csv(DATA_DIR / "new_tickets.csv")
orders_df = pd.read_csv(DATA_DIR / "orders_context.csv")

database.init_db()


def _get_ticket_row(ticket_id: str):
    row = new_tickets_df[new_tickets_df["ticket_id"] == ticket_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    return row.iloc[0]


def _get_order_context(order_id: str) -> Optional[dict]:
    row = orders_df[orders_df["order_id"] == order_id]
    if row.empty:
        return None
    r = row.iloc[0]
    return {
        "order_id": r["order_id"],
        "items": int(r["items"]),
        "value_inr": float(r["value_inr"]),
        "delivery_time_min": int(r["delivery_time_min"]),
        "delivery_status": r["delivery_status"],
    }


def _resolve_ticket(ticket_id: str) -> DecisionResponse:
    ticket = _get_ticket_row(ticket_id)
    order_context = _get_order_context(ticket["order_id"])

    result = decision_engine.decide(ticket["description"], order_context)
    reply, reply_source = generate_reply(
        description=ticket["description"],
        action=result["action"],
        refund_amount=result.get("refund_amount"),
        status=result["status"],
    )

    database.log_decision(
        ticket_id=ticket_id,
        action=result["action"],
        confidence=result["confidence"],
        status=result["status"],
        reason=" | ".join(result["reason"]),
    )

    return DecisionResponse(
        ticket_id=ticket_id,
        description=ticket["description"],
        order_id=ticket["order_id"],
        action=result["action"],
        status=result["status"],
        confidence=result["confidence"],
        reason=result["reason"],
        guardrails_passed=result["guardrails_passed"],
        order_context=order_context,
        precedents=result["precedents"],
        reply=reply,
        reply_source=reply_source,
        refund_amount=result.get("refund_amount"),
    )


@app.get("/tickets")
def list_tickets():
    return new_tickets_df.to_dict(orient="records")


@app.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: str):
    ticket = _get_ticket_row(ticket_id)
    order_context = _get_order_context(ticket["order_id"])
    return {
        "ticket_id": ticket["ticket_id"],
        "created_at": ticket["created_at"],
        "order_id": ticket["order_id"],
        "description": ticket["description"],
        "order_context": order_context,
    }


@app.post("/tickets/{ticket_id}/resolve", response_model=DecisionResponse)
def resolve_ticket(ticket_id: str):
    return _resolve_ticket(ticket_id)


@app.post("/tickets/{ticket_id}/override")
def override_ticket(ticket_id: str, body: OverrideRequest):
    _get_ticket_row(ticket_id)  # 404 if unknown
    log_id = database.apply_override(ticket_id, body.action, body.reason)
    if log_id is None:
        raise HTTPException(
            status_code=400,
            detail="No prior decision found for this ticket. Call /resolve first.",
        )
    return {"ticket_id": ticket_id, "human_action": body.action, "override_reason": body.reason,
            "status": "human_resolved"}


@app.get("/decisions", response_model=list[DecisionLogOut])
def list_decisions():
    rows = database.get_all_decisions()
    return [
        DecisionLogOut(
            id=r["id"], ticket_id=r["ticket_id"], action=r["action"],
            confidence=r["confidence"] or 0.0, status=r["status"], reason=r["reason"] or "",
            timestamp=r["timestamp"], human_action=r["human_action"],
            override_reason=r["override_reason"],
        )
        for r in rows
    ]


@app.get("/")
def root():
    return {"service": "SupportIQ", "status": "running"}
