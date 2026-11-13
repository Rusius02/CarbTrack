import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from backend.carbtrack.application.workspace_service import WorkspaceService
from backend.carbtrack.infrastructure.persistence.sqlite_workspace_repository import (
    SQLiteWorkspaceRepository,
)
from backend.carbtrack.presentation.http_server import create_server


class HttpServerTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        root = Path(self.temporary_directory.name)
        repository = SQLiteWorkspaceRepository(root / "carbtrack.sqlite3")
        self.server = create_server("127.0.0.1", 0, WorkspaceService(repository), root)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        host, port = self.server.server_address
        self.base_url = f"http://{host}:{port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temporary_directory.cleanup()

    def test_api_round_trip_persists_workspace(self):
        with urlopen(f"{self.base_url}/api/health") as response:
            self.assertEqual(json.load(response)["storage"], "sqlite")
        with urlopen(f"{self.base_url}/api/workspace") as response:
            self.assertFalse(json.load(response)["initialized"])

        payload = {
            "profile": "organization",
            "goal": 1600,
            "activities": [{
                "id": "api-activity",
                "name": "Électricité",
                "category": "Énergie",
                "quantity": 12,
                "unit": "kWh",
                "factor": 0.4,
                "year": 2026,
                "scope": "Scope 2",
            }],
        }
        request = Request(
            f"{self.base_url}/api/workspace",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="PUT",
        )
        with urlopen(request) as response:
            self.assertTrue(json.load(response)["initialized"])
        with urlopen(f"{self.base_url}/api/workspace") as response:
            saved = json.load(response)
        self.assertEqual(saved["activities"][0]["id"], "api-activity")
        self.assertEqual(saved["profile"], "organization")

    def test_invalid_write_returns_client_error_without_replacing_saved_state(self):
        invalid_payload = {"profile": "unexpected", "goal": 100, "activities": []}
        request = Request(
            f"{self.base_url}/api/workspace",
            data=json.dumps(invalid_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="PUT",
        )
        with self.assertRaises(HTTPError) as response:
            urlopen(request)
        self.assertEqual(response.exception.code, 400)
        try:
            self.assertIn("profil", json.load(response.exception)["error"])
        finally:
            response.exception.close()
