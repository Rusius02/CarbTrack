CREATE TABLE workspaces (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    profile TEXT NOT NULL CHECK (profile IN ('personal', 'organization')),
    annual_goal REAL NOT NULL CHECK (annual_goal > 0),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE activities (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id INTEGER NOT NULL DEFAULT 1 REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
    category TEXT NOT NULL CHECK (category IN ('Transport', 'Énergie', 'Alimentation', 'Achats', 'Numérique', 'Autre')),
    quantity REAL NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL CHECK (length(trim(unit)) BETWEEN 1 AND 20),
    factor REAL NOT NULL CHECK (factor >= 0),
    year INTEGER NOT NULL CHECK (year >= 1900),
    scope TEXT NOT NULL CHECK (scope IN ('Scope 1', 'Scope 2', 'Scope 3')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_activities_workspace_year ON activities(workspace_id, year);
