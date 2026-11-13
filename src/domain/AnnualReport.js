import { ACTIVITY_CATEGORIES } from "./constants.js";

export class AnnualReport {
  constructor(year, activities) {
    if (!Number.isInteger(year)) {
      throw new TypeError("L’année du rapport est invalide.");
    }
    if (!Array.isArray(activities)) {
      throw new TypeError("Les activités du rapport doivent être une liste.");
    }
    this.year = year;
    this.activities = Object.freeze([...activities]);
    Object.freeze(this);
  }

  get totalEmissions() {
    return this.activities.reduce((total, activity) => total + activity.emissions, 0);
  }

  get categoryTotals() {
    const totals = new Map(ACTIVITY_CATEGORIES.map((category) => [category, 0]));
    for (const activity of this.activities) {
      totals.set(activity.category, totals.get(activity.category) + activity.emissions);
    }
    return totals;
  }

  get leadingCategory() {
    return [...this.categoryTotals.entries()]
      .sort((left, right) => right[1] - left[1])[0];
  }

  getCategoryShare(category) {
    if (this.totalEmissions === 0) return 0;
    return (this.categoryTotals.get(category) || 0) / this.totalEmissions * 100;
  }
}
