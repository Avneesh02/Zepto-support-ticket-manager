"""TF-IDF similarity search over historical resolved tickets.

The index is built ONCE at import/service-start time and reused for every
lookup — it is never rebuilt per-request.
"""
import argparse
import json
import sys
from pathlib import Path
from typing import List

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


class SimilarityEngine:
    def __init__(self, resolved_path: Path = DATA_DIR / "resolved_tickets.csv"):
        self.df = pd.read_csv(resolved_path)
        self.vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
        )
        self._matrix = self.vectorizer.fit_transform(self.df["description"].astype(str))

    def top_k(self, query: str, k: int = 3) -> List[dict]:
        """Return the top-k most similar resolved tickets for a query string.

        Ties (equal similarity scores) are broken deterministically by
        original row order. This matters in practice: resolved_tickets.csv
        contains exact-duplicate description text with different resolution
        actions, so ties at similarity=1.0 are common. The default
        numpy argsort() is NOT guaranteed stable across numpy versions for
        this case, which made the top-3 (and therefore the auto/human
        decision) silently differ across environments. Explicit tie-break
        by index makes this reproducible everywhere.
        """
        query_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vec, self._matrix).flatten()
        order = sorted(range(len(scores)), key=lambda i: (-scores[i], i))
        top_idx = order[:k]

        results = []
        for idx in top_idx:
            row = self.df.iloc[idx]
            results.append({
                "ticket_id": row["ticket_id"],
                "description": row["description"],
                "category": row["category"],
                "action": row["resolution_action"],
                "resolution_note": row["resolution_note"],
                "csat": int(row["csat"]),
                "similarity": round(float(scores[idx]), 4),
            })
        return results

    def test_all(self, new_tickets_df: pd.DataFrame, k: int = 3) -> pd.DataFrame:
        """Utility: run top-k retrieval for every row of a new-tickets dataframe."""
        rows = []
        for _, ticket in new_tickets_df.iterrows():
            precedents = self.top_k(ticket["description"], k=k)
            rows.append({
                "ticket_id": ticket["ticket_id"],
                "description": ticket["description"],
                "top_similarity": precedents[0]["similarity"] if precedents else 0.0,
                "top_action": precedents[0]["action"] if precedents else None,
                "actions": [p["action"] for p in precedents],
            })
        return pd.DataFrame(rows)


# Module-level singleton — built once when the service starts.
similarity_engine = SimilarityEngine()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run similarity lookup against resolved tickets.")
    parser.add_argument("query", nargs="+", help="Query text to search")
    parser.add_argument("-k", type=int, default=3, help="Number of top results to return")
    args = parser.parse_args()

    query_text = " ".join(args.query)
    results = similarity_engine.top_k(query_text, k=args.k)
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
