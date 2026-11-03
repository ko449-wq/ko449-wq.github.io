"""A small REST API with JSON validation, SQLite persistence and no third-party dependencies."""
import argparse
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

from database import create_issue, delete_issue, get_issue, initialize, list_issues, update_issue

PRIORITIES = {'low', 'medium', 'high'}
STATUSES = {'open', 'in_progress', 'closed'}
ALLOWED = {'title', 'description', 'priority', 'status'}


class InputError(ValueError):
    pass


def validate(data, *, partial=False):
    if not isinstance(data, dict):
        raise InputError('Expected a JSON object')
    if set(data) - ALLOWED:
        raise InputError('Unsupported fields: ' + ', '.join(sorted(set(data) - ALLOWED)))
    if not partial and 'title' not in data:
        raise InputError('title is required')
    if partial and not data:
        raise InputError('Provide at least one field to update')
    cleaned = dict(data)
    if 'title' in cleaned:
        if not isinstance(cleaned['title'], str) or not 1 <= len(cleaned['title'].strip()) <= 120:
            raise InputError('title must contain 1-120 characters')
        cleaned['title'] = cleaned['title'].strip()
    if 'description' in cleaned:
        if not isinstance(cleaned['description'], str) or len(cleaned['description']) > 2000:
            raise InputError('description must be a string of 2000 characters or fewer')
    if 'priority' in cleaned and (not isinstance(cleaned['priority'], str) or cleaned['priority'] not in PRIORITIES):
        raise InputError('priority must be low, medium or high')
    if 'status' in cleaned and (not isinstance(cleaned['status'], str) or cleaned['status'] not in STATUSES):
        raise InputError('status must be open, in_progress or closed')
    if not partial:
        cleaned.setdefault('description', '')
        cleaned.setdefault('priority', 'medium')
        cleaned.setdefault('status', 'open')
    return cleaned


def make_handler(db_path):
    class Handler(BaseHTTPRequestHandler):
        server_version = 'IssueDesk/1.0'

        def send_json(self, status, payload):
            encoded = json.dumps(payload).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(encoded)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(encoded)

        def issue_id(self, path):
            if path.startswith('/api/issues/'):
                value = path.removeprefix('/api/issues/')
                return int(value) if value.isascii() and value.isdecimal() and int(value) > 0 else None
            return None

        def read_json(self):
            content_type = self.headers.get('Content-Type', '').split(';')[0].strip()
            if content_type != 'application/json':
                raise InputError('Content-Type must be application/json')
            try:
                length = int(self.headers.get('Content-Length', '0'))
            except ValueError as exc:
                raise InputError('Invalid Content-Length') from exc
            if length <= 0 or length > 16_384:
                raise InputError('JSON body must be 1-16384 bytes')
            try:
                return json.loads(self.rfile.read(length))
            except (json.JSONDecodeError, UnicodeDecodeError) as exc:
                raise InputError('Malformed JSON body') from exc

        def do_GET(self):
            url = urlsplit(self.path)
            if url.path == '/health':
                return self.send_json(200, {'status': 'ok', 'service': 'issue-desk-api'})
            if url.path == '/api/issues':
                try:
                    query = parse_qs(url.query)
                    if set(query) - {'status', 'limit', 'offset'}:
                        raise InputError('Unsupported query parameter')
                    status = query.get('status', [None])[0]
                    if status is not None and status not in STATUSES:
                        raise InputError('Invalid status filter')
                    limit = int(query.get('limit', ['20'])[0])
                    offset = int(query.get('offset', ['0'])[0])
                    if not 1 <= limit <= 100 or not 0 <= offset <= 1_000_000:
                        raise InputError('limit must be 1-100 and offset must be 0-1000000')
                    return self.send_json(200, list_issues(db_path, status=status, limit=limit, offset=offset))
                except (ValueError, InputError) as exc:
                    return self.send_json(400, {'error': str(exc)})
            issue_id = self.issue_id(url.path)
            if issue_id:
                item = get_issue(db_path, issue_id)
                return self.send_json(200, item) if item else self.send_json(404, {'error': 'Issue not found'})
            return self.send_json(404, {'error': 'Route not found'})

        def do_POST(self):
            if urlsplit(self.path).path != '/api/issues':
                return self.send_json(404, {'error': 'Route not found'})
            try:
                item = create_issue(db_path, validate(self.read_json()))
            except InputError as exc:
                return self.send_json(400, {'error': str(exc)})
            return self.send_json(201, item)

        def do_PATCH(self):
            issue_id = self.issue_id(urlsplit(self.path).path)
            if not issue_id:
                return self.send_json(404, {'error': 'Route not found'})
            try:
                data = validate(self.read_json(), partial=True)
            except InputError as exc:
                return self.send_json(400, {'error': str(exc)})
            if not get_issue(db_path, issue_id):
                return self.send_json(404, {'error': 'Issue not found'})
            return self.send_json(200, update_issue(db_path, issue_id, data))

        def do_DELETE(self):
            issue_id = self.issue_id(urlsplit(self.path).path)
            if not issue_id:
                return self.send_json(404, {'error': 'Route not found'})
            if delete_issue(db_path, issue_id):
                return self.send_json(200, {'deleted': True, 'id': issue_id})
            return self.send_json(404, {'error': 'Issue not found'})

        def log_message(self, fmt, *args):
            if os.environ.get('ISSUEDESK_QUIET') != '1':
                super().log_message(fmt, *args)

    return Handler


def serve(db_path='data/issues.db', host='127.0.0.1', port=8080):
    initialize(db_path)
    server = ThreadingHTTPServer((host, port), make_handler(db_path))
    print(f'IssueDesk serving http://{host}:{server.server_port} (database: {db_path})')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='IssueDesk Python/SQLite REST API')
    parser.add_argument('--db', default='data/issues.db', help='SQLite database location')
    parser.add_argument('--port', type=int, default=8080)
    parser.add_argument('--host', default='127.0.0.1', help='Bind to localhost by default')
    args = parser.parse_args()
    serve(db_path=args.db, host=args.host, port=args.port)
