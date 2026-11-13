from backend.carbtrack.domain.workspace import Workspace


class WorkspaceService:
    def __init__(self, workspace_repository):
        self._workspace_repository = workspace_repository

    def get_workspace(self):
        workspace = self._workspace_repository.get()
        if workspace is None:
            return {"profile": "personal", "goal": 2000, "activities": [], "initialized": False}
        return {**workspace.to_dict(), "initialized": True}

    def save_workspace(self, payload):
        workspace = Workspace.from_dict(payload)
        self._workspace_repository.save(workspace)
        return {**workspace.to_dict(), "initialized": True}
