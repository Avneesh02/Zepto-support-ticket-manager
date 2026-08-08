"""Generates the customer-facing reply.

IMPORTANT: this module never decides the action. It only phrases a reply for
an action the decision engine has already determined. If no LLM API key is
configured — or the LLM call fails for any reason — a template fallback is
used and the system keeps working unmodified.

Every call returns (reply_text, source) where source is "llm" or "template",
so the API and frontend can show, per-ticket, whether that specific reply
was AI-personalized or template-generated. That visibility is the point:
it proves the LLM is wired in and load-bearing for tone, not decorative.
"""
import argparse
import json
import logging
import os
import sys
from pathlib import Path
from typing import Optional, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

logger = logging.getLogger(__name__)

# Cheap, fast model — this call only rephrases 1-2 sentences of already-decided
# content, so a lightweight model is the right tool, not the flagship.
REPLY_MODEL = "claude-haiku-4-5-20251001"
LLM_TIMEOUT_SECONDS = 6.0
MAX_REPLY_CHARS = 500  # sanity cap so a malformed LLM response can't leak

SYSTEM_PROMPT = (
    "You rewrite a customer-support reply to sound warmer and more natural, "
    "in 1-2 short sentences. You NEVER change what was decided: keep the exact "
    "action, the exact refund amount if one is stated, and never invent a "
    "promise, discount, or timeline that is not already in the original reply. "
    "Output only the rewritten reply text — no preamble, no quotes, no labels."
)

TEMPLATES = {
    "redelivery": "We're sorry about the issue with your order. We've arranged a redelivery for the affected item(s).",
    "partial_refund": "We're sorry about the issue with your order. We've processed a partial refund of ₹{amount} for the affected item(s).",
    "full_refund": "We're sorry about the issue with your order. We've processed a full refund of ₹{amount}.",
    "refund_reissue": "We're sorry about the issue with your order. We've reissued a refund of ₹{amount}.",
    "coupon": "We're sorry about the issue with your order. We've added a coupon to your account as an apology.",
    "escalation": "We're sorry about the issue with your order. We've escalated this to our specialist team.",
    "apology_no_action": "We're sorry for the inconvenience caused. Thank you for letting us know.",
}

HUMAN_REVIEW_TEMPLATE = (
    "We're sorry about the issue with your order. Your case has been forwarded "
    "to our support team for review."
)


def _template_reply(action: Optional[str], refund_amount: Optional[float], status: str) -> str:
    if status == "needs_human" or action is None:
        return HUMAN_REVIEW_TEMPLATE
    template = TEMPLATES.get(action, HUMAN_REVIEW_TEMPLATE)
    if "{amount}" in template:
        return template.format(amount=refund_amount if refund_amount is not None else "N/A")
    return template


def _amount_preserved(candidate: str, refund_amount: Optional[float]) -> bool:
    """Guardrail on the LLM's own output: if a refund amount exists, its
    digits must still appear verbatim in the rewritten text. If the model
    drops or alters the number, we don't trust the rewrite."""
    if refund_amount is None:
        return True
    amount_str = str(int(refund_amount)) if refund_amount == int(refund_amount) else str(refund_amount)
    return amount_str in candidate


def generate_reply(description: str, action: Optional[str], refund_amount: Optional[float],
                    status: str) -> Tuple[str, str]:
    """Public entry point. Returns (reply_text, source).

    source is "llm" when an LLM call succeeded and passed the output
    guardrail, otherwise "template". The action itself was decided upstream
    by decision_engine and is never touched here — this function only
    controls phrasing.
    """
    base_reply = _template_reply(action, refund_amount, status)

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return base_reply, "template"

    try:
        import anthropic  # optional dependency, only imported if a key is set

        client = anthropic.Anthropic(api_key=api_key, timeout=LLM_TIMEOUT_SECONDS)
        response = client.messages.create(
            model=REPLY_MODEL,
            max_tokens=150,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": f"Customer complaint: {description}\nOriginal reply: {base_reply}",
            }],
        )
        text = "".join(block.text for block in response.content if hasattr(block, "text")).strip()

        if not text or len(text) > MAX_REPLY_CHARS:
            logger.warning("LLM reply rejected (empty or too long); falling back to template.")
            return base_reply, "template"

        if not _amount_preserved(text, refund_amount):
            logger.warning("LLM reply dropped/changed the refund amount; falling back to template.")
            return base_reply, "template"

        return text, "llm"

    except Exception as exc:
        # Any LLM failure (missing dep, timeout, rate limit, network) falls
        # back to the template — the system must keep working without a key.
        logger.warning("LLM reply generation failed (%s); falling back to template.", exc)
        return base_reply, "template"


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a customer reply from a decided action.")
    parser.add_argument("description", nargs="+", help="Ticket description text")
    parser.add_argument("action", type=str, nargs="?", default=None, help="Resolved action")
    parser.add_argument("--status", type=str, default="needs_human", help="Decision status")
    parser.add_argument("--refund-amount", type=float, default=None, help="Refund amount in INR")
    args = parser.parse_args()

    description = " ".join(args.description)
    reply, source = generate_reply(
        description=description,
        action=args.action,
        refund_amount=args.refund_amount,
        status=args.status,
    )
    print(json.dumps({"reply": reply, "source": source}, indent=2))


if __name__ == "__main__":
    main()