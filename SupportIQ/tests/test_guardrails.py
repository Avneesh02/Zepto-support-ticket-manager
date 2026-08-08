import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from services import guardrails  # noqa: E402


def test_refund_within_value_passes():
    passed, violations = guardrails.check("partial_refund", 400, 999, "delivered")
    assert passed is True
    assert violations == []


def test_refund_exceeding_value_fails():
    passed, violations = guardrails.check("full_refund", 1200, 999, "delivered")
    assert passed is False
    assert len(violations) == 1


def test_cancelled_redelivery_fails():
    passed, violations = guardrails.check("redelivery", None, 999, "cancelled")
    assert passed is False
    assert len(violations) == 1


def test_cancelled_refund_passes():
    passed, violations = guardrails.check("full_refund", 999, 999, "cancelled")
    assert passed is True


def test_delivered_redelivery_passes():
    passed, violations = guardrails.check("redelivery", None, 999, "delivered")
    assert passed is True


def test_multiple_violations_reported():
    passed, violations = guardrails.check("redelivery", 2000, 999, "cancelled")
    assert passed is False
    assert len(violations) == 1  # redelivery isn't a refund action, only rule 2 applies
