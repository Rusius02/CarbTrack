import test from "node:test";
import assert from "node:assert/strict";
import { LocalStorageStateRepository } from "../../src/infrastructure/persistence/LocalStorageStateRepository.js";

function createStorage(initial = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (key, nextValue) => { value = nextValue; },
    get value() { return value; }
  };
}

test("LocalStorageStateRepository lit et écrit le format de workspace courant", () => {
  const storage = createStorage(JSON.stringify({
    profile: "organization", goal: 1800, activities: []
  }));
  const repository = new LocalStorageStateRepository(storage);
  assert.deepEqual(repository.load(), { profile: "organization", goal: 1800, activities: [] });
  repository.save({ profile: "personal", goal: 2500, activities: [] });
  assert.equal(JSON.parse(storage.value).goal, 2500);
});

test("LocalStorageStateRepository signale les données corrompues", () => {
  const silentLogger = { error() {} };
  const repository = new LocalStorageStateRepository(createStorage("{"), silentLogger);
  assert.throws(() => repository.load(), /illisibles/i);
});
