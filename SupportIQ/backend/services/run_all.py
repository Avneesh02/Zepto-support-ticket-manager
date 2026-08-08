from __future__ import annotations

import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

COMMANDS = [
    {
        "name": "similarity",
        "cmd": [sys.executable, str(BASE_DIR / "similarity.py"), "milk packet missing from my order", "-k", "3"],
    },
    {
        "name": "guardrails",
        "cmd": [sys.executable, str(BASE_DIR / "guardrails.py"), "redelivery", "--order-value", "100", "--delivery-status", "delivered"],
    },
    {
        "name": "reply_generator",
        "cmd": [sys.executable, str(BASE_DIR / "reply_generator.py"), "Sorry for the issue", "redelivery", "--status", "auto_resolved", "--refund-amount", "10"],
    },
    {
        "name": "decision_engine",
        "cmd": [sys.executable, str(BASE_DIR / "decision_engine.py"), "milk packet missing from my order", "--order-value", "500", "--delivery-status", "delivered"],
    },
]


def run_step(name: str, cmd: list[str]) -> None:
    print(f"=== Running {name} ===")
    print("Command:", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True)
    print("--- stdout ---")
    print(result.stdout.strip())
    print("--- stderr ---")
    print(result.stderr.strip())
    if result.returncode != 0:
        raise SystemExit(f"{name} failed with exit code {result.returncode}")


def main() -> None:
    print("Running all service modules from backend/services...")
    for step in COMMANDS:
        run_step(step["name"], step["cmd"])
    print("All service modules completed successfully.")


if __name__ == "__main__":
    main()
