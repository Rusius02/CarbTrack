import test from "node:test";
import assert from "node:assert/strict";
import { HttpWorkspaceRepository } from "../../src/infrastructure/persistence/HttpWorkspaceRepository.js";

function createStorage(initial = null) {
  let value = initial;
  return {
    getItem: () => value,
    removeItem: () => { value = null; },
    get value() { return value; }
  };
}

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  };
}

test("HttpWorkspaceRepository reads and writes through the API", async () => {
  const calls = [];
  const fetcher = async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === "PUT") {
      return jsonResponse({ ...JSON.parse(options.body), initialized: true });
    }
    return jsonResponse({ profile: "personal", goal: 2000, activities: [], initialized: false });
  };
  const repository = new HttpWorkspaceRepository({ fetcher, legacyStorage: null });
  assert.deepEqual(await repository.load(), {
    profile: "personal", goal: 2000, activities: [], initialized: false
  });
  assert.deepEqual(await repository.save({ profile: "personal", goal: 1800, activities: [] }), {
    profile: "personal", goal: 1800, activities: [], initialized: true
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[1].options.method, "PUT");
});

test("HttpWorkspaceRepository migrates valid legacy data only after API save", async () => {
  const storage = createStorage(JSON.stringify({
    profile: "organization",
    goal: 1750,
    activities: [{
      id: "legacy-1", name: "Électricité", category: "Énergie",
      quantity: 10, unit: "kWh", factor: 0.4, year: 2026, scope: "Scope 2"
    }]
  }));
  const calls = [];
  const fetcher = async (url, options = {}) => {
    calls.push(options.method || "GET");
    if (options.method === "PUT") {
      return jsonResponse({ ...JSON.parse(options.body), initialized: true });
    }
    return jsonResponse({ profile: "personal", goal: 2000, activities: [], initialized: false });
  };
  const repository = new HttpWorkspaceRepository({ fetcher, legacyStorage: storage });
  const state = await repository.load();
  assert.equal(state.profile, "organization");
  assert.equal(state.activities[0].id, "legacy-1");
  assert.equal(storage.value, null);
  assert.deepEqual(calls, ["GET", "PUT"]);
});

test("HttpWorkspaceRepository preserves legacy data when the API save fails", async () => {
  const legacyData = JSON.stringify({ profile: "personal", goal: 2000, activities: [] });
  const storage = createStorage(legacyData);
  const fetcher = async (_url, options = {}) => {
    if (options.method === "PUT") return jsonResponse({ error: "Database unavailable" }, 500);
    return jsonResponse({ profile: "personal", goal: 2000, activities: [], initialized: false });
  };
  const repository = new HttpWorkspaceRepository({ fetcher, legacyStorage: storage });
  await assert.rejects(repository.load(), /Database unavailable/);
  assert.equal(storage.value, legacyData);
});
