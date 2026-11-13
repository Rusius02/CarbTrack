from contextlib import contextmanager
from pathlib import Path
import sqlite3

from backend.carbtrack.application.ports.workspace_repository import WorkspaceRepository
from backend.carbtrack.domain.workspace import Activity, Workspace


class SQLiteWorkspaceRepository(WorkspaceRepository):
    def __init__(self, database_path, migrations_path=None):
        self.database_path = Path(database_path)
        self.migrations_path = (
            Path(migrations_path)
            if migrations_path
            else Path(__file__).with_name("migrations")
        )
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._apply_migrations()

    def get(self):
        with self._connect() as connection:
            workspace_row = connection.execute(
                "SELECT profile, annual_goal FROM workspaces WHERE id = 1"
            ).fetchone()
            if workspace_row is None:
                return None

            rows = connection.execute(
                """
                SELECT id, name, category, quantity, unit, factor, year, scope
                FROM activities
                WHERE workspace_id = 1
                ORDER BY created_at, id
                """
            ).fetchall()
            activities = tuple(
                Activity(
                    id=row["id"],
                    name=row["name"],
                    category=row["category"],
                    quantity=row["quantity"],
                    unit=row["unit"],
                    factor=row["factor"],
                    year=row["year"],
                    scope=row["scope"],
                )
                for row in rows
            )
            return Workspace(
                profile=workspace_row["profile"],
                goal=workspace_row["annual_goal"],
                activities=activities,
            )

    def save(self, workspace):
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            try:
                connection.execute(
                    """
                    INSERT INTO workspaces (id, profile, annual_goal)
                    VALUES (1, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        profile = excluded.profile,
                        annual_goal = excluded.annual_goal,
                        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
                    """,
                    (workspace.profile, workspace.goal),
                )
                connection.execute("DELETE FROM activities WHERE workspace_id = 1")
                connection.executemany(
                    """
                    INSERT INTO activities
                        (id, workspace_id, name, category, quantity, unit, factor, year, scope)
                    VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    [
                        (
                            activity.id,
                            activity.name,
                            activity.category,
                            activity.quantity,
                            activity.unit,
                            activity.factor,
                            activity.year,
                            activity.scope,
                        )
                        for activity in workspace.activities
                    ],
                )
                connection.commit()
            except Exception:
                connection.rollback()
                raise

    @contextmanager
    def _connect(self):
        connection = sqlite3.connect(
            self.database_path,
            timeout=5,
            isolation_level=None,
        )
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA busy_timeout = 5000")
        try:
            yield connection
        finally:
            connection.close()

    def _apply_migrations(self):
        migrations = sorted(self.migrations_path.glob("[0-9][0-9][0-9]_*.sql"))
        if not migrations:
            raise RuntimeError(f"Aucune migration SQLite trouvée dans {self.migrations_path}.")
        with self._connect() as connection:
            current_version = connection.execute("PRAGMA user_version").fetchone()[0]
            for migration in migrations:
                version = int(migration.name.split("_", maxsplit=1)[0])
                if version <= current_version:
                    continue
                script = migration.read_text(encoding="utf-8")
                connection.executescript(
                    f"BEGIN IMMEDIATE;\n{script}\nPRAGMA user_version = {version};\nCOMMIT;"
                )
                current_version = version
