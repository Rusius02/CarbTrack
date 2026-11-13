import { StateRepository } from "../../application/ports/StateRepository.js";
import { Activity } from "../../domain/Activity.js";

const STORAGE_KEY = "carbtrack-v1";

export class BrowserWorkspaceRepository extends StateRepository {
  constructor(storage, logger = console) {
    super();
    this.storage = storage;
    this.logger = logger;
  }

  async load() {
    let serialized;
    try {
      serialized = this.storage.getItem(STORAGE_KEY);
    } catch (error) {
      this.logger.error("Impossible de lire les données QA du navigateur.", error);
      throw new Error("Le stockage local du navigateur est inaccessible.", { cause: error });
    }

    if (!serialized) {
      return { profile: "personal", goal: null, activities: [], initialized: false };
    }

    let state;
    try {
      state = JSON.parse(serialized);
    } catch (error) {
      this.logger.error("Les données QA enregistrées ne sont pas un JSON valide.", error);
      throw new Error("Les données QA du navigateur sont illisibles.", { cause: error });
    }
    if (!state || typeof state !== "object" || !Array.isArray(state.activities)) {
      throw new TypeError("Le format des données QA du navigateur est invalide.");
    }

    return {
      profile: state.profile,
      goal: state.goal,
      activities: state.activities.map((activity) => Activity.fromJSON(activity).toJSON()),
      initialized: true
    };
  }

  async save(state) {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
      return { ...state, initialized: true };
    } catch (error) {
      this.logger.error("Impossible d’enregistrer les données QA du navigateur.", error);
      throw new Error("L’enregistrement QA local a échoué. Vérifiez le stockage du navigateur.", {
        cause: error
      });
    }
  }
}
