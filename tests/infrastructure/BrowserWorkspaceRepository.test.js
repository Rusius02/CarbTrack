import test from "node:test";
import assert from "node:assert/strict";
import { BrowserWorkspaceRepository } from "../../src/infrastructure/persistence/BrowserWorkspaceRepository.js";

function createStorage(initial = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, nextValue) => { value = nextValue; },
    get value() { return value; }
  };
}

test("BrowserWorkspaceRepository starts empty and round-trips valid data", async () => {
  const storage = createStorage();
  const repository = new BrowserWorkspaceRepository(storage);
  assert.deepEqual(await repository.load(), {
    profile: "personal", goal: null, activities: [], initialized: false
  });

  const state = {
    profile: "organization",
    goal: 1800,
    activities: [{
      id: "qa-1",
      name: "Électricité",
      category: "Énergie",
      quantity: 10,
      unit: "kWh",
      factor: 0.4,
      year: 2026,
      scope: "Scope 2"
    }]
  };
  await repository.save(state);
  assert.equal((await repository.load()).activities[0].id, "qa-1");
});

test("BrowserWorkspaceRepository surfaces malformed stored activities", async () => {
  const storage = createStorage(JSON.stringify({
    profile: "personal",
    goal: 2000,
    activities: [{ id: "invalid" }]
  }));
  const repository = new BrowserWorkspaceRepository(storage);
  await assert.rejects(repository.load(), /description|catégorie|activité/i);
});
