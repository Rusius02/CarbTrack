import tempfile
import unittest
from pathlib import Path
import sqlite3
from types import SimpleNamespace

from backend.carbtrack.application.workspace_service import WorkspaceService
from backend.carbtrack.domain.workspace import Activity, ValidationError, Workspace
from backend.carbtrack.infrastructure.persistence.sqlite_workspace_repository import (
    SQLiteWorkspaceRepository,
)


class SQLiteWorkspaceRepositoryTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temporary_directory.name) / "nested" / "carbtrack.sqlite3"
        self.repository = SQLiteWorkspaceRepository(self.database_path)

    def tearDown(self):
        self.temporary_directory.cleanup()

    def test_workspace_is_persisted_across_repository_instances(self):
        activity = Activity(
            id="activity-1",
            name="Trajet en voiture",
            category="Transport",
            quantity=100,
            unit="km",
            factor=0.19,
            year=2026,
        )
        workspace = Workspace("organization", 1500, (activity,))
        self.repository.save(workspace)

        restored = SQLiteWorkspaceRepository(self.database_path).get()
        self.assertEqual(restored.profile, "organization")
        self.assertEqual(restored.goal, 1500)
        self.assertEqual(restored.activities, (activity,))

    def test_empty_database_has_no_workspace(self):
        self.assertIsNone(self.repository.get())

    def test_save_replaces_the_workspace_atomically(self):
        first = Workspace("personal", 2000, ())
        second = Workspace(
            "personal",
            1800,
            (Activity("a2", "Train", "Transport", 10, "km", 0.03, 2026),),
        )
        self.repository.save(first)
        self.repository.save(second)
        restored = self.repository.get()
        self.assertEqual(restored.goal, 1800)
        self.assertEqual([activity.id for activity in restored.activities], ["a2"])

    def test_failed_write_rolls_back_workspace_and_activity_changes(self):
        original = Workspace(
            "personal",
            2000,
            (Activity("original", "Original", "Autre", 1, "u", 0.1, 2026),),
        )
        self.repository.save(original)
        invalid_activity = SimpleNamespace(
            id="invalid",
            name="Invalid",
            category="unknown",
            quantity=1,
            unit="u",
            factor=0.1,
            year=2026,
            scope="Scope 3",
        )
        invalid_workspace = SimpleNamespace(
            profile="organization",
            goal=1000,
            activities=(invalid_activity,),
        )
        with self.assertRaises(sqlite3.IntegrityError):
            self.repository.save(invalid_workspace)

        restored = self.repository.get()
        self.assertEqual(restored.profile, "personal")
        self.assertEqual(restored.goal, 2000)
        self.assertEqual([activity.id for activity in restored.activities], ["original"])


class WorkspaceServiceTests(unittest.TestCase):
    def test_first_read_returns_uninitialized_workspace(self):
        service = WorkspaceService(_InMemoryRepository())
        self.assertEqual(
            service.get_workspace(),
            {"profile": "personal", "goal": 2000, "activities": [], "initialized": False},
        )

    def test_save_validates_and_returns_initialized_workspace(self):
        repository = _InMemoryRepository()
        service = WorkspaceService(repository)
        payload = {
            "profile": "personal",
            "goal": 1800,
            "activities": [{
                "id": "a1", "name": "Train", "category": "Transport",
                "quantity": 10, "unit": "km", "factor": 0.03, "year": 2026
            }],
        }
        saved = service.save_workspace(payload)
        self.assertTrue(saved["initialized"])
        self.assertEqual(service.get_workspace()["activities"][0]["id"], "a1")

    def test_save_rejects_duplicate_activity_ids(self):
        service = WorkspaceService(_InMemoryRepository())
        data = {
            "profile": "personal",
            "goal": 2000,
            "activities": [
                {"id": "a1", "name": "One", "category": "Autre", "quantity": 1,
                 "unit": "u", "factor": 0, "year": 2026},
                {"id": "a1", "name": "Two", "category": "Autre", "quantity": 1,
                 "unit": "u", "factor": 0, "year": 2026},
            ],
        }
        with self.assertRaisesRegex(ValidationError, "uniques"):
            service.save_workspace(data)


class _InMemoryRepository:
    def __init__(self):
        self.workspace = None

    def get(self):
        return self.workspace

    def save(self, workspace):
        self.workspace = workspace
