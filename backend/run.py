import logging
import os
from pathlib import Path

from backend.carbtrack.application.workspace_service import WorkspaceService
from backend.carbtrack.infrastructure.persistence.sqlite_workspace_repository import (
    SQLiteWorkspaceRepository,
)
from backend.carbtrack.presentation.http_server import create_server


def main():
    project_root = Path(__file__).resolve().parents[1]
    database_path = Path(
        os.environ.get("CARBTRACK_DB_PATH", project_root / "data" / "carbtrack.sqlite3")
    )
    port = int(os.environ.get("CARBTRACK_PORT", "8000"))
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    repository = SQLiteWorkspaceRepository(database_path)
    service = WorkspaceService(repository)
    server = create_server("127.0.0.1", port, service, project_root)
    logging.info("CarbTrack écoute sur http://127.0.0.1:%s (SQLite : %s)", port, database_path)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logging.info("Arrêt demandé.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
