"""SQLite access layer for IssueDesk. Uses parameterized SQL and per-request connections."""
import sqlite3
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
    description TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL CHECK(status IN ('open', 'in_progress', 'closed')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
"""


def connect(db_path):
    conn = sqlite3.connect(str(db_path), timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys=ON')
    return conn


def initialize(db_path):
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    with connect(db_path) as conn:
        conn.executescript(SCHEMA)


def as_dict(row):
    return dict(row) if row is not None else None


def list_issues(db_path, *, status=None, limit=20, offset=0):
    clauses, params = [], []
    if status:
        clauses.append('status = ?')
        params.append(status)
    where = 'WHERE ' + ' AND '.join(clauses) if clauses else ''
    with connect(db_path) as conn:
        count = conn.execute(f'SELECT COUNT(*) FROM issues {where}', params).fetchone()[0]
        rows = conn.execute(f'SELECT * FROM issues {where} ORDER BY id DESC LIMIT ? OFFSET ?', [*params, limit, offset]).fetchall()
    return {'items': [as_dict(row) for row in rows], 'total': count, 'limit': limit, 'offset': offset}


def get_issue(db_path, issue_id):
    with connect(db_path) as conn:
        return as_dict(conn.execute('SELECT * FROM issues WHERE id = ?', (issue_id,)).fetchone())


def create_issue(db_path, issue):
    with connect(db_path) as conn:
        cursor = conn.execute(
            'INSERT INTO issues (title, description, priority, status) VALUES (?, ?, ?, ?)',
            (issue['title'], issue['description'], issue['priority'], issue['status']),
        )
        issue_id = cursor.lastrowid
    return get_issue(db_path, issue_id)


def update_issue(db_path, issue_id, updates):
    fields = [key for key in ('title', 'description', 'priority', 'status') if key in updates]
    if not fields:
        return get_issue(db_path, issue_id)
    values = [updates[field] for field in fields]
    sets = ', '.join(f'{key} = ?' for key in fields)
    with connect(db_path) as conn:
        conn.execute(f"UPDATE issues SET {sets}, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?", [*values, issue_id])
    return get_issue(db_path, issue_id)


def delete_issue(db_path, issue_id):
    with connect(db_path) as conn:
        result = conn.execute('DELETE FROM issues WHERE id = ?', (issue_id,))
        return result.rowcount > 0
