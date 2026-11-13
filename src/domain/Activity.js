import { ACTIVITY_CATEGORIES, EMISSION_SCOPES } from "./constants.js";

export class Activity {
  constructor({ id, name, category, quantity, unit, factor, year, scope = "Scope 3" }) {
    if (typeof id !== "string" || !id.trim()) {
      throw new TypeError("Une activité doit posséder un identifiant.");
    }
    if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
      throw new TypeError("La description doit contenir entre 1 et 80 caractères.");
    }
    if (!ACTIVITY_CATEGORIES.includes(category)) {
      throw new TypeError("La catégorie de l’activité est invalide.");
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new TypeError("La quantité doit être un nombre positif.");
    }
    if (typeof unit !== "string" || !unit.trim() || unit.trim().length > 20) {
      throw new TypeError("L’unité doit contenir entre 1 et 20 caractères.");
    }
    if (!Number.isFinite(factor) || factor < 0) {
      throw new TypeError("Le facteur d’émission doit être positif ou nul.");
    }
    if (!Number.isFinite(quantity * factor)) {
      throw new TypeError("Le résultat du calcul des émissions dépasse la plage numérique.");
    }
    if (!Number.isInteger(year) || year < 1900) {
      throw new TypeError("L’année de l’activité est invalide.");
    }
    if (!EMISSION_SCOPES.includes(scope)) {
      throw new TypeError("Le périmètre d’émissions est invalide.");
    }

    this.id = id.trim();
    this.name = name.trim();
    this.category = category;
    this.quantity = quantity;
    this.unit = unit.trim();
    this.factor = factor;
    this.year = year;
    this.scope = scope;
    Object.freeze(this);
  }

  get emissions() {
    return this.quantity * this.factor;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      quantity: this.quantity,
      unit: this.unit,
      factor: this.factor,
      year: this.year,
      scope: this.scope
    };
  }

  static fromJSON(data) {
    return new Activity(data);
  }
}
