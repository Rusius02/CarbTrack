import { StateRepository } from "../../application/ports/StateRepository.js";
import { Activity } from "../../domain/Activity.js";

const LEGACY_STORAGE_KEY = "carbtrack-v1";

export class HttpWorkspaceRepository extends StateRepository {
  constructor({
    fetcher = globalThis.fetch.bind(globalThis),
    legacyStorage = window.localStorage,
    logger = console
  } = {}) {
    super();
    this.fetcher = fetcher;
    this.legacyStorage = legacyStorage;
    this.logger = logger;
    this.endpoint = "/api/workspace";
  }

  async load() {
    const state = await this.request(this.endpoint);
    if (!state.initialized && this.legacyStorage) {
      const importedState = this.readLegacyState();
      if (importedState) {
        const savedState = await this.save(importedState);
        this.legacyStorage.removeItem(LEGACY_STORAGE_KEY);
        return savedState;
      }
    }
    return state;
  }

  async save(state) {
    return this.request(this.endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    });
  }

  readLegacyState() {
    let serialized;
    try {
      serialized = this.legacyStorage.getItem(LEGACY_STORAGE_KEY);
    } catch (error) {
      this.logger.error("Impossible de lire les anciennes données CarbTrack.", error);
      throw new Error("Les anciennes données ne peuvent pas être lues.", { cause: error });
    }
    if (!serialized) return null;

    let state;
    try {
      state = JSON.parse(serialized);
    } catch (error) {
      this.logger.error("Les anciennes données CarbTrack ne sont pas un JSON valide.", error);
      throw new Error("La migration des anciennes données a échoué : format invalide.", { cause: error });
    }
    if (!state || typeof state !== "object" || !Array.isArray(state.activities)) {
      throw new TypeError("La migration a échoué : les anciennes données ont un format invalide.");
    }

    return {
      profile: state.profile === "organization" ? "organization" : "personal",
      goal: Number.isFinite(state.goal) && state.goal > 0 ? state.goal : 2000,
      activities: state.activities.map((item) => Activity.fromJSON(item).toJSON())
    };
  }

  async request(url, options = {}) {
    let response;
    try {
      response = await this.fetcher(url, options);
    } catch (error) {
      this.logger.error("Le serveur CarbTrack local est inaccessible.", error);
      throw new Error("Impossible de joindre le serveur local CarbTrack. Vérifiez qu’il est démarré.", {
        cause: error
      });
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error(`Le serveur CarbTrack a renvoyé une réponse invalide (${response.status}).`, {
        cause: error
      });
    }

    if (!response.ok) {
      throw new Error(payload.error || `La requête a échoué (${response.status}).`);
    }
    return payload;
  }
}
