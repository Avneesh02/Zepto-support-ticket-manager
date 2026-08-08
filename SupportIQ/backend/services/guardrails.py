"""Hard business rules. These always override confidence.

Any single guardrail failure forces status = needs_human.
"""
import sys
from pathlib import Path
from typing import List, Optional, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

REFUND_ACTIONS = {"partial_refund", "full_refund", "refund_reissue"}


def check(action: Optional[str], refund_amount: Optional[float],
          order_value: float, delivery_status: str) -> Tuple[bool, List[str]]:
    """Run all guardrails. Returns (passed, list_of_violation_messages)."""
    violations: List[str] = []

    # RULE 1: refund amount must never exceed order value
    if action in REFUND_ACTIONS and refund_amount is not None:
        if refund_amount > order_value:
            violations.append(
                f"Refund amount (₹{refund_amount}) exceeds order value (₹{order_value})."
            )

    # RULE 2: cancelled order must never trigger redelivery
    if delivery_status == "cancelled" and action == "redelivery":
        violations.append("Order is cancelled — redelivery is not a valid action.")

    return (len(violations) == 0, violations)


def main() -> None:
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Run guardrail checks for one resolved action.")
    parser.add_argument("action", type=str, help="Resolved action to validate")
    parser.add_argument("--refund-amount", type=float, default=None, help="Refund amount in INR")
    parser.add_argument("--order-value", type=float, required=True, help="Order value in INR")
    parser.add_argument("--delivery-status", type=str, required=True, help="Order delivery status")
    args = parser.parse_args()

    passed, violations = check(
        action=args.action,
        refund_amount=args.refund_amount,
        order_value=args.order_value,
        delivery_status=args.delivery_status,
    )
    print(json.dumps({"passed": passed, "violations": violations}, indent=2))


if __name__ == "__main__":
    main()
