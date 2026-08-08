"""SQLite storage for decision logs."""
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

DB_PATH = Path(__file__).resolve().parent / "supportiq.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id TEXT NOT NULL,
            action TEXT,
            confidence REAL,
            status TEXT NOT NULL,
            reason TEXT,
            timestamp TEXT NOT NULL,
            human_action TEXT,
            override_reason TEXT
        )
    """)
    conn.commit()
    conn.close()


def log_decision(ticket_id: str, action: Optional[str], confidence: float,
                  status: str, reason: str) -> int:
    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO decisions (ticket_id, action, confidence, status, reason, timestamp) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (ticket_id, action, confidence, status, reason, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id


def apply_override(ticket_id: str, human_action: str, override_reason: str) -> Optional[int]:
    """Update the most recent decision for a ticket with a human override."""
    conn = get_connection()
    row = conn.execute(
        "SELECT id FROM decisions WHERE ticket_id = ? ORDER BY id DESC LIMIT 1", (ticket_id,)
    ).fetchone()
    if row is None:
        conn.close()
        return None
    conn.execute(
        "UPDATE decisions SET human_action = ?, override_reason = ?, status = 'human_resolved' "
        "WHERE id = ?",
        (human_action, override_reason, row["id"]),
    )
    conn.commit()
    conn.close()
    return row["id"]


def get_all_decisions() -> List[sqlite3.Row]:
    conn = get_connection()
    rows = conn.execute("SELECT * FROM decisions ORDER BY id DESC").fetchall()
    conn.close()
    return rows


def get_latest_decision(ticket_id: str) -> Optional[sqlite3.Row]:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM decisions WHERE ticket_id = ? ORDER BY id DESC LIMIT 1", (ticket_id,)
    ).fetchone()
    conn.close()
    return row
