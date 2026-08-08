import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from services.similarity import similarity_engine  # noqa: E402


def test_top_k_returns_three():
    results = similarity_engine.top_k("milk packet missing from my order", k=3)
    assert len(results) == 3


def test_top_k_fields_present():
    results = similarity_engine.top_k("eggs broken in package", k=3)
    for r in results:
        for field in ("ticket_id", "description", "category", "action",
                       "resolution_note", "csat", "similarity"):
            assert field in r


def test_exact_match_has_similarity_one():
    results = similarity_engine.top_k("eggs broken in package", k=1)
    assert results[0]["similarity"] == 1.0


def test_results_sorted_descending():
    results = similarity_engine.top_k("delivery way past promised time", k=3)
    sims = [r["similarity"] for r in results]
    assert sims == sorted(sims, reverse=True)


def test_index_built_once():
    # calling top_k repeatedly should not change vectorizer vocabulary size
    before = len(similarity_engine.vectorizer.vocabulary_)
    similarity_engine.top_k("some new unseen phrase entirely", k=3)
    after = len(similarity_engine.vectorizer.vocabulary_)
    assert before == after
