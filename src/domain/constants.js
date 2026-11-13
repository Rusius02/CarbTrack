export const ACTIVITY_CATEGORIES = Object.freeze([
  "Transport",
  "Énergie",
  "Alimentation",
  "Achats",
  "Numérique",
  "Autre"
]);

export const EMISSION_SCOPES = Object.freeze(["Scope 1", "Scope 2", "Scope 3"]);

export const DEFAULT_ANNUAL_GOAL = 2000;

export const DEMO_ACTIVITIES = Object.freeze([
  { name: "Trajets en voiture", category: "Transport", quantity: 2400, unit: "km", factor: 0.19 },
  { name: "Électricité du logement", category: "Énergie", quantity: 850, unit: "kWh", factor: 0.05 },
  { name: "Achats du quotidien", category: "Achats", quantity: 12, unit: "mois", factor: 18 }
]);
