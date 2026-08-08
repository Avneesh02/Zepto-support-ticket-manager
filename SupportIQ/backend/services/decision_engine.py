"""Deterministic decision layer. This — not the LLM — decides the action.

Pipeline: precedents -> action agreement -> similarity check -> order context
-> guardrails -> conflict check -> confidence -> auto vs human.

NOTE ON ORDERING: guardrails MUST run whenever we have a candidate_action,
regardless of whether precedents conflict. Previously the conflict check
returned early before guardrails ran, which meant a ticket whose precedents
disagreed (common with this dataset — many exact-duplicate description
strings resolved with different actions) could bypass guardrails entirely.
That let unsafe actions (e.g. redeliver on a cancelled order) slip through
just because the precedent set happened to be conflicting. Guardrails are a
safety check and must never be skippable by any other branch.
"""
import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services import guardrails
from services.similarity import similarity_engine

# Configurable thresholds — tune against the real 30 tickets before demo.
MIN_SIMILARITY_THRESHOLD = 0.35
AUTO_RESOLVE_THRESHOLD = 0.75

# Deterministic, centralized simulated refund policy.
# Multiplier applied to order value. Easy to change in one place.
REFUND_POLICY = {
    "full_refund": 1.0,
    "refund_reissue": 1.0,
    "partial_refund": 0.5,
}


def compute_refund_amount(action: Optional[str], order_value: float) -> Optional[float]:
    if action not in REFUND_POLICY:
        return None
    amount = round(order_value * REFUND_POLICY[action], 2)
    return min(amount, order_value)  # never allow refund > order value


def decide(description: str, order_context: Optional[dict]) -> Dict:
    """Run the full deterministic decision pipeline for one ticket."""
    precedents: List[dict] = similarity_engine.top_k(description, k=3)
    reasons: List[str] = []

    if not precedents:
        return _needs_human(precedents, None, 0.0, ["No historical precedents found."],
                             order_context, True)

    top_similarity = precedents[0]["similarity"]
    candidate_action = precedents[0]["action"]
    actions = [p["action"] for p in precedents]
    agreement = actions.count(candidate_action) / len(actions)
    conflicting = agreement < 1.0

    confidence = round(0.60 * top_similarity + 0.40 * agreement, 4)

    # RULE: low similarity -> human review (overrides confidence).
    # No reliable candidate action to run guardrails against, so this is
    # the one legitimate early return.
    if top_similarity < MIN_SIMILARITY_THRESHOLD:
        reasons.append(
            f"Similarity below threshold ({top_similarity:.2f} < {MIN_SIMILARITY_THRESHOLD})."
        )
        return _needs_human(precedents, candidate_action, confidence, reasons,
                             order_context, True)

    if conflicting:
        reasons.append("Historical precedents recommend conflicting actions.")

    # Order context / guardrails — ALWAYS evaluated once we have a
    # candidate_action, independent of the conflict flag above.
    refund_amount = None
    guardrails_passed = True
    if order_context is None:
        reasons.append("No matching order context found.")
        guardrails_passed = False
    else:
        refund_amount = compute_refund_amount(candidate_action, order_context["value_inr"])
        guardrails_passed, violations = guardrails.check(
            action=candidate_action,
            refund_amount=refund_amount,
            order_value=order_context["value_inr"],
            delivery_status=order_context["delivery_status"],
        )
        reasons.extend(violations)

    # RULE: conflicting precedents -> human review (overrides confidence),
    # no majority voting. Checked here (after guardrails have already run
    # and recorded their own violations) so a conflicting-precedent ticket
    # that also fails guardrails surfaces BOTH reasons.
    if conflicting:
        return _needs_human(precedents, candidate_action, confidence, reasons,
                             order_context, guardrails_passed, refund_amount)

    if not guardrails_passed:
        return _needs_human(precedents, candidate_action, confidence, reasons,
                             order_context, False, refund_amount)

    reasons.append(f"{sum(1 for a in actions if a == candidate_action)}/3 precedents recommend {candidate_action}.")
    reasons.append(f"Highest similarity: {top_similarity:.2f}.")
    if order_context is not None:
        reasons.append(f"Order status: {order_context['delivery_status']}.")
    reasons.append("Guardrails passed.")

    if confidence >= AUTO_RESOLVE_THRESHOLD:
        status = "auto_resolved"
    else:
        status = "needs_human"
        reasons.append(f"Confidence below auto-resolve threshold ({confidence:.2f} < {AUTO_RESOLVE_THRESHOLD}).")

    return {
        "action": candidate_action,
        "status": status,
        "confidence": confidence,
        "reason": reasons,
        "guardrails_passed": guardrails_passed,
        "precedents": precedents,
        "refund_amount": refund_amount,
    }


def _needs_human(precedents, action, confidence, reasons, order_context, guardrails_passed,
                  refund_amount=None):
    return {
        "action": action,
        "status": "needs_human",
        "confidence": confidence,
        "reason": reasons,
        "guardrails_passed": guardrails_passed,
        "precedents": precedents,
        "refund_amount": refund_amount,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the decision engine for a ticket description.")
    parser.add_argument("description", nargs="+", help="Ticket description text")
    parser.add_argument("--order-value", type=float, default=None, help="Order value in INR")
    parser.add_argument("--delivery-status", type=str, default=None, help="Delivery status")
    args = parser.parse_args()

    description = " ".join(args.description)
    order_context = None
    if args.order_value is not None and args.delivery_status is not None:
        order_context = {
            "value_inr": args.order_value,
            "delivery_status": args.delivery_status,
        }

    result = decide(description, order_context)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()