import test from "node:test";
import assert from "node:assert/strict";
import { Activity } from "../../src/domain/Activity.js";

const validActivity = {
  id: "activity-1",
  name: "Trajet en voiture",
  category: "Transport",
  quantity: 100,
  unit: "km",
  factor: 0.2,
  year: 2026,
  scope: "Scope 3"
};

test("Activity calcule les émissions et garde son état immuable", () => {
  const activity = new Activity(validActivity);
  assert.equal(activity.emissions, 20);
  assert.equal(Object.isFrozen(activity), true);
  assert.deepEqual(Activity.fromJSON(activity.toJSON()).toJSON(), activity.toJSON());
});

test("Activity refuse les quantités, catégories et facteurs invalides", () => {
  assert.throws(() => new Activity({ ...validActivity, quantity: 0 }), /quantité/i);
  assert.throws(() => new Activity({ ...validActivity, category: "Inconnue" }), /catégorie/i);
  assert.throws(() => new Activity({ ...validActivity, factor: -1 }), /facteur/i);
});
