import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402

client = TestClient(app)


def test_list_tickets():
    resp = client.get("/tickets")
    assert resp.status_code == 200
    assert len(resp.json()) == 30


def test_get_single_ticket():
    resp = client.get("/tickets/N-004")
    assert resp.status_code == 200
    body = resp.json()
    assert body["ticket_id"] == "N-004"
    assert body["order_context"] is not None


def test_get_unknown_ticket_404():
    resp = client.get("/tickets/N-999")
    assert resp.status_code == 404


def test_resolve_full_pipeline():
    resp = client.post("/tickets/N-004/resolve")
    assert resp.status_code == 200
    body = resp.json()
    assert body["ticket_id"] == "N-004"
    assert body["status"] in ("auto_resolved", "needs_human")
    assert len(body["precedents"]) == 3
    assert isinstance(body["reply"], str) and len(body["reply"]) > 0


def test_resolve_logs_decision():
    client.post("/tickets/N-009/resolve")
    resp = client.get("/decisions")
    assert resp.status_code == 200
    tickets_logged = [d["ticket_id"] for d in resp.json()]
    assert "N-009" in tickets_logged


def test_human_override_requires_prior_decision():
    resp = client.post("/tickets/N-006/override", json={"action": "partial_refund", "reason": "test"})
    # N-006 was resolved in earlier full-suite runs of test_resolve_full_pipeline-style calls;
    # ensure at least one resolve happens first for a clean assertion here.
    if resp.status_code == 400:
        client.post("/tickets/N-006/resolve")
        resp = client.post("/tickets/N-006/override", json={"action": "partial_refund", "reason": "test"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["human_action"] == "partial_refund"
    assert body["status"] == "human_resolved"


def test_reply_never_empty_for_human_review():
    resp = client.post("/tickets/N-002/resolve")  # known conflicting-precedent ticket
    body = resp.json()
    assert body["status"] == "needs_human"
    assert "forwarded" in body["reply"].lower() or len(body["reply"]) > 0
