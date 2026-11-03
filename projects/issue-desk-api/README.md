# IssueDesk — Python + SQLite REST API

A small but fully functional **issue-tracking backend** built using only the Python standard library. It uses a `ThreadingHTTPServer` for JSON endpoints and SQLite for persistence, with a separation between HTTP request handling and database operations. This is a code-focused project (GitHub Pages cannot run the Python backend).

## Features
- `GET /health` for a simple health check.
- `GET /api/issues` for listing issues with `status`, `limit`, and `offset` filters.
- `GET /api/issues/{id}` for retrieving one record.
- `POST /api/issues` for creating new issues; validates title, description, priority, and status.
- `PATCH /api/issues/{id}` for partial edits.
- `DELETE /api/issues/{id}` for deletion.
- SQLite schema and index, parameterized SQL, input validation, consistent JSON errors.
- Seven integration test methods using a temporary database and an actual local HTTP server.

## Quick start

Requires **Python 3.10+** and no pip dependencies.

```bash
cd projects/issue-desk-api
python3 api.py --db data/issues.db --port 8080
# in another terminal:
curl http://127.0.0.1:8080/health
curl -X POST http://127.0.0.1:8080/api/issues -H 'Content-Type: application/json' -d '{"title":"Review onboarding flow","priority":"high"}'
curl 'http://127.0.0.1:8080/api/issues?status=open&limit=10'
```

Run tests with `python3 -m unittest discover -s tests -v` from the project directory. Tests do not depend on existing database files or network access beyond localhost. The service binds to `127.0.0.1` by default; it is a portfolio sample, not a hardened public production service. For production, add authentication, authorization, rate limiting, observability, database migrations, and a mature web framework.

## Sample issue

```json
{"id":1,"title":"Review onboarding flow","description":"","priority":"high","status":"open","created_at":"2026-11-02T00:00:00Z","updated_at":"2026-11-02T00:00:00Z"}
```

The sample timestamp above is illustrative; actual timestamps are assigned by SQLite at insertion.

**Author:** Kolawole Ogunniyi · Portfolio engineering sample.
