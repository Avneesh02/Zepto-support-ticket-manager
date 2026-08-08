"""Tests for the optional LLM-powered reply rewrite.

Uses a fake `anthropic` module injected into sys.modules so these tests run
without network access or a real ANTHROPIC_API_KEY — the same shape any CI
runner without secrets would need. Each test reloads services.reply_generator
so it re-reads os.environ and re-imports the (possibly fake) anthropic module.
"""
import importlib
import os
import sys
import types

import pytest


def _install_fake_anthropic(create_fn):
    """Install a fake anthropic module whose messages.create() calls create_fn(kwargs)."""
    fake_anthropic = types.ModuleType("anthropic")

    class FakeBlock:
        def __init__(self, text):
            self.text = text

    class FakeResponse:
        def __init__(self, text):
            self.content = [FakeBlock(text)]

    class FakeMessages:
        def create(self, **kwargs):
            return FakeResponse(create_fn(kwargs))

    class FakeClient:
        def __init__(self, api_key=None, timeout=None):
            self.messages = FakeMessages()

    fake_anthropic.Anthropic = FakeClient
    sys.modules["anthropic"] = fake_anthropic


def _load_reply_generator():
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
    import services.reply_generator as rg
    return importlib.reload(rg)


@pytest.fixture(autouse=True)
def _cleanup():
    yield
    sys.modules.pop("anthropic", None)
    os.environ.pop("ANTHROPIC_API_KEY", None)


def test_no_api_key_uses_template():
    os.environ.pop("ANTHROPIC_API_KEY", None)
    rg = _load_reply_generator()
    reply, source = rg.generate_reply("eggs broken", "full_refund", 500.0, "auto_resolved")
    assert source == "template"
    assert "500" in reply


def test_llm_success_returns_llm_source_and_preserves_amount():
    os.environ["ANTHROPIC_API_KEY"] = "fake-key"
    _install_fake_anthropic(lambda kwargs: "So sorry! We've refunded 250 to your account.")
    rg = _load_reply_generator()
    reply, source = rg.generate_reply("milk packet missing", "partial_refund", 250.0, "auto_resolved")
    assert source == "llm"
    assert "250" in reply


def test_llm_dropping_refund_amount_falls_back_to_template():
    os.environ["ANTHROPIC_API_KEY"] = "fake-key"
    _install_fake_anthropic(lambda kwargs: "So sorry! We've issued your refund.")
    rg = _load_reply_generator()
    reply, source = rg.generate_reply("milk packet missing", "partial_refund", 250.0, "auto_resolved")
    assert source == "template"
    assert "250" in reply  # template always includes the correct amount


def test_llm_exception_falls_back_to_template():
    os.environ["ANTHROPIC_API_KEY"] = "fake-key"

    def boom(kwargs):
        raise RuntimeError("simulated API timeout")

    _install_fake_anthropic(boom)
    rg = _load_reply_generator()
    reply, source = rg.generate_reply("late delivery", "coupon", None, "auto_resolved")
    assert source == "template"
    assert reply  # still produced a usable reply


def test_llm_empty_response_falls_back_to_template():
    os.environ["ANTHROPIC_API_KEY"] = "fake-key"
    _install_fake_anthropic(lambda kwargs: "   ")
    rg = _load_reply_generator()
    reply, source = rg.generate_reply("late delivery", "coupon", None, "auto_resolved")
    assert source == "template"


def test_needs_human_status_never_calls_llm_for_action_content():
    # status=needs_human always uses the human-review template regardless of
    # whether an LLM is configured, since there is no decided action to phrase.
    os.environ.pop("ANTHROPIC_API_KEY", None)
    rg = _load_reply_generator()
    reply, source = rg.generate_reply("something odd", None, None, "needs_human")
    assert source == "template"
    assert "forwarded" in reply.lower()