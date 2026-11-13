import test from "node:test";
import assert from "node:assert/strict";
import { ExportAnnualReport } from "../../src/application/use-cases/ExportAnnualReport.js";
import { GenerateAnnualReport } from "../../src/application/use-cases/GenerateAnnualReport.js";
import { LoadWorkspace } from "../../src/application/use-cases/LoadWorkspace.js";
import { RecordActivity } from "../../src/application/use-cases/RecordActivity.js";
import { RemoveActivity } from "../../src/application/use-cases/RemoveActivity.js";
import { SaveWorkspace } from "../../src/application/use-cases/SaveWorkspace.js";
import { Activity } from "../../src/domain/Activity.js";

function createMemoryRepository(initial = {}) {
  let state = {
    profile: initial.profile || "personal",
    goal: initial.goal || 2000,
    activities: initial.activities || []
  };
  return {
    load: () => state,
    save: (nextState) => { state = nextState; },
    getState: () => state
  };
}

test("LoadWorkspace restaure et valide les entités depuis le port", async () => {
  const activity = new Activity({
    id: "a1", name: "Vol", category: "Transport", quantity: 3,
    unit: "km", factor: 2, year: 2026, scope: "Scope 3"
  });
  const repository = createMemoryRepository({ activities: [activity.toJSON()] });
  const workspace = await new LoadWorkspace(repository).execute();
  assert.equal(workspace.activities[0] instanceof Activity, true);
  assert.equal(workspace.goal, 2000);
});

test("RecordActivity valide, ajoute et sauvegarde une activité", async () => {
  const repository = createMemoryRepository();
  const saveWorkspace = new SaveWorkspace(repository);
  const workspace = await new LoadWorkspace(repository).execute();
  const useCase = new RecordActivity({ saveWorkspace, createId: () => "activity-2" });
  const result = await useCase.execute({
    workspace,
    year: 2026,
    input: {
      name: "Électricité", category: "Énergie", quantity: "10",
      unit: "kWh", factor: "0.5", scope: "Scope 2"
    }
  });
  assert.equal(result.activity.emissions, 5);
  assert.equal(result.activity.scope, "Scope 3");
  assert.equal(repository.getState().activities.length, 1);
});

test("RemoveActivity supprime uniquement l’activité ciblée", async () => {
  const repository = createMemoryRepository();
  const saveWorkspace = new SaveWorkspace(repository);
  const activities = ["a1", "a2"].map((id) => new Activity({
    id, name: id, category: "Autre", quantity: 1, unit: "u", factor: 1, year: 2026
  }));
  const next = await new RemoveActivity(saveWorkspace).execute({ profile: "personal", goal: 2, activities }, "a1");
  assert.deepEqual(next.activities.map((activity) => activity.id), ["a2"]);
});

test("ExportAnnualReport produit un CSV filtré par année et protège les formules", () => {
  const activities = [
    new Activity({
      id: "a1", name: "=1+1", category: "Transport", quantity: 10,
      unit: "km", factor: 0.3, year: 2026
    }),
    new Activity({
      id: "a2", name: "Ancien trajet", category: "Transport", quantity: 10,
      unit: "km", factor: 0.3, year: 2025
    })
  ];
  const csv = new ExportAnnualReport(new GenerateAnnualReport()).execute(activities, 2026);
  assert.match(csv, /'=1\+1/);
  assert.doesNotMatch(csv, /Ancien trajet/);
  assert.match(csv, /3/);
});
