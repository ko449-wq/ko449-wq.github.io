"""HTTP-level integration tests covering success paths, validation, and pagination."""
import http.client
import json
import os
import sys
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from api import make_handler  # noqa: E402
from database import initialize  # noqa: E402


class IssueApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.db_path = os.path.join(cls.temp.name, 'issues.db')
        initialize(cls.db_path)
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), make_handler(cls.db_path))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=3)
        cls.temp.cleanup()

    def request(self, method, path, data=None, headers=None):
        conn = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=5)
        body = json.dumps(data) if data is not None else None
        hdrs = {'Content-Type': 'application/json', **(headers or {})}
        conn.request(method, path, body=body, headers=hdrs)
        result = conn.getresponse()
        status = result.status
        payload = json.loads(result.read())
        conn.close()
        return status, payload

    def test_01_health_check(self):
        code, data = self.request('GET', '/health')
        self.assertEqual(code, 200)
        self.assertEqual(data['status'], 'ok')

    def test_02_create_issue_and_fetch(self):
        code, data = self.request('POST', '/api/issues', {'title': ' Fix login bug ', 'priority': 'high'})
        self.assertEqual(code, 201)
        self.assertEqual(data['title'], 'Fix login bug')
        self.assertEqual(data['status'], 'open')
        self.__class__.issue_id = data['id']
        code, fetched = self.request('GET', f"/api/issues/{data['id']}")
        self.assertEqual(code, 200)
        self.assertEqual(fetched['id'], data['id'])

    def test_03_update_issue(self):
        code, data = self.request('PATCH', f'/api/issues/{self.issue_id}', {'status': 'in_progress'})
        self.assertEqual(code, 200)
        self.assertEqual(data['status'], 'in_progress')

    def test_04_validation_and_sql_injection(self):
        self.assertEqual(self.request('POST', '/api/issues', {'title': ''})[0], 400)
        self.assertEqual(self.request('POST', '/api/issues', {'title': 'ok', 'priority': 'critical'})[0], 400)
        self.assertEqual(self.request('POST', '/api/issues', {'title': 'ok', 'admin': True})[0], 400)
        code, data = self.request('POST', '/api/issues', {'title': "Robert'); DROP TABLE issues;--"})
        self.assertEqual(code, 201)
        self.assertEqual(data['title'], "Robert'); DROP TABLE issues;--")
        self.assertEqual(self.request('GET', '/api/issues')[0], 200)

    def test_05_status_filter_and_pagination(self):
        code, data = self.request('GET', '/api/issues?status=in_progress&limit=1&offset=0')
        self.assertEqual(code, 200)
        self.assertEqual(len(data['items']), 1)
        self.assertGreaterEqual(data['total'], 1)
        self.assertEqual(self.request('GET', '/api/issues?limit=0')[0], 400)
        self.assertEqual(self.request('GET', '/api/issues?status=nope')[0], 400)

    def test_06_missing_issue_and_delete(self):
        self.assertEqual(self.request('GET', '/api/issues/999999')[0], 404)
        self.assertEqual(self.request('PATCH', '/api/issues/999999', {'status': 'closed'})[0], 404)
        self.assertEqual(self.request('DELETE', f'/api/issues/{self.issue_id}')[0], 200)
        self.assertEqual(self.request('GET', f'/api/issues/{self.issue_id}')[0], 404)

    def test_07_content_type_and_empty_patch(self):
        self.assertEqual(self.request('POST', '/api/issues', {'title': 'Test'}, {'Content-Type': 'text/plain'})[0], 400)
        self.assertEqual(self.request('PATCH', '/api/issues/1', {})[0], 400)


if __name__ == '__main__':
    unittest.main()
