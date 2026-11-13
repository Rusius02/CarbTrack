from abc import ABC, abstractmethod


class WorkspaceRepository(ABC):
    @abstractmethod
    def get(self):
        """Return the persisted workspace or None when none has been saved."""

    @abstractmethod
    def save(self, workspace):
        """Atomically persist the complete workspace."""
