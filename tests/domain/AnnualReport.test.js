import test from "node:test";
import assert from "node:assert/strict";
import { Activity } from "../../src/domain/Activity.js";
import { AnnualReport } from "../../src/domain/AnnualReport.js";

function activity(id, category, quantity, factor, year = 2026) {
  return new Activity({
    id,
    name: id,
    category,
    quantity,
    unit: "unit",
    factor,
    year
  });
}

test("AnnualReport agrège les émissions et détermine le premier poste", () => {
  const report = new AnnualReport(2026, [
    activity("car", "Transport", 100, 0.2),
    activity("train", "Transport", 10, 0.1),
    activity("power", "Énergie", 50, 0.4)
  ]);
  assert.equal(report.totalEmissions, 41);
  assert.equal(report.categoryTotals.get("Transport"), 21);
  assert.deepEqual(report.leadingCategory, ["Transport", 21]);
  assert.equal(report.getCategoryShare("Transport"), 21 / 41 * 100);
});
