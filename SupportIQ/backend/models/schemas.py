"""Pydantic models used across the API."""
from typing import List, Optional
from pydantic import BaseModel


class Precedent(BaseModel):
    ticket_id: str
    description: str
    category: str
    action: str
    resolution_note: str
    csat: int
    similarity: float


class OrderContext(BaseModel):
    order_id: str
    items: int
    value_inr: float
    delivery_time_min: int
    delivery_status: str


class DecisionResponse(BaseModel):
    ticket_id: str
    description: str
    order_id: str
    action: Optional[str]
    status: str  # auto_resolved | needs_human
    confidence: float
    reason: List[str]
    guardrails_passed: bool
    order_context: Optional[OrderContext]
    precedents: List[Precedent]
    reply: str
    reply_source: str  # "llm" | "template"
    refund_amount: Optional[float] = None


class OverrideRequest(BaseModel):
    action: str
    reason: str


class DecisionLogOut(BaseModel):
    id: int
    ticket_id: str
    action: Optional[str]
    confidence: float
    status: str
    reason: str
    timestamp: str
    human_action: Optional[str] = None
    override_reason: Optional[str] = None
