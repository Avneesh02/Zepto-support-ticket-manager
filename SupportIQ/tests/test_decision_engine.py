import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from services import decision_engine  # noqa: E402


def order(value=999.0, status="delivered"):
    return {"order_id": "TEST", "items": 1, "value_inr": value,
            "delivery_time_min": 20, "delivery_status": status}


# CASE 1: strong missing-item precedents -> auto-resolved
def test_strong_precedent_auto_resolves():
    result = decision_engine.decide("eggs broken in package", order())
    assert result["status"] == "auto_resolved"
    assert result["guardrails_passed"] is True


# CASE 2: novel/weak ticket -> needs human
def test_weak_similarity_needs_human():
    result = decision_engine.decide("xyzzy quantum teleportation malfunction gremlins", order())
    assert result["status"] == "needs_human"


# CASE 3: conflicting historical actions -> needs human, no majority voting
def test_conflicting_actions_needs_human():
    result = decision_engine.decide("milk packet missing from my order", order())
    actions = {p["action"] for p in result["precedents"]}
    assert len(actions) > 1  # confirms this ticket genuinely has conflicting precedents
    assert result["status"] == "needs_human"
    assert any("conflict" in r.lower() for r in result["reason"])


# CASE 4: cancelled order + redelivery -> blocked, needs human
def test_cancelled_order_blocks_redelivery():
    result = decision_engine.decide("got salted butter instead of unsalted", order(status="cancelled"))
    assert result["action"] == "redelivery"
    assert result["status"] == "needs_human"
    assert result["guardrails_passed"] is False


# CASE 5: refund amount > order value -> blocked, needs human.
# The deterministic REFUND_POLICY caps refunds at order value by construction,
# so decision_engine can never generate an over-limit refund on its own. The
# guardrail is defense-in-depth: it must independently catch an over-limit
# refund_amount regardless of how it was produced. We verify that safety net
# directly, the same way a bug in the policy would be caught in production.
def test_refund_exceeding_order_value_blocked_via_guardrail():
    from services import guardrails
    passed, violations = guardrails.check(
        action="full_refund", refund_amount=1500.0, order_value=999.0, delivery_status="delivered"
    )
    assert passed is False
    assert any("exceeds order value" in v for v in violations)


def test_refund_policy_never_exceeds_order_value_by_construction():
    # Confirms the policy-level guarantee that makes over-limit refunds unreachable
    # through the normal decision pipeline in the first place.
    for action in decision_engine.REFUND_POLICY:
        for value in (0.0, 1.0, 999.0, 50000.0):
            amt = decision_engine.compute_refund_amount(action, value)
            assert amt <= value


def test_confidence_formula_bounds():
    result = decision_engine.decide("eggs broken in package", order())
    assert 0.0 <= result["confidence"] <= 1.0


def test_refund_amount_never_exceeds_order_value():
    for value in (100.0, 999.0, 5000.0):
        amt = decision_engine.compute_refund_amount("full_refund", value)
        assert amt <= value
        amt = decision_engine.compute_refund_amount("partial_refund", value)
        assert amt <= value
