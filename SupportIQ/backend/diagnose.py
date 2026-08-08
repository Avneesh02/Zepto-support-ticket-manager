import sys
import sklearn, pandas
print("Python:", sys.version)
print("scikit-learn:", sklearn.__version__)
print("pandas:", pandas.__version__)

sys.path.insert(0, "backend")
from services.similarity import similarity_engine

for q in ["eggs broken in package", "milk packet missing from my order", "got salted butter instead of unsalted"]:
    print(f"\nQuery: {q!r}")
    for p in similarity_engine.top_k(q, k=3):
        print(f"  {p['ticket_id']}  sim={p['similarity']:.4f}  action={p['action']}  desc={p['description'][:50]!r}")