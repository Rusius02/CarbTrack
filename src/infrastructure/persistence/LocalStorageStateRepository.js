import { StateRepository } from "../../application/ports/StateRepository.js";

const STORAGE_KEY = "carbtrack-v1";

export class LocalStorageStateRepository extends StateRepository {
  constructor(storage, logger = console) {
    super();
    this.storage = storage;
    this.logger = logger;
  }

  load() {
    let serializedState;
    try {
      serializedState = this.storage.getItem(STORAGE_KEY);
    } catch (error) {
      this.logger.error("Impossible de lire le stockage local CarbTrack.", error);
      throw new Error("Le stockage local est inaccessible.", { cause: error });
    }

    if (!serializedState) {
      return { profile: "personal", goal: null, activities: [] };
    }

    let state;
    try {
      state = JSON.parse(serializedState);
    } catch (error) {
      this.logger.error("Les données locales CarbTrack ne sont pas un JSON valide.", error);
      throw new Error("Les données CarbTrack enregistrées sont illisibles.", { cause: error });
    }

    if (!state || typeof state !== "object" || !Array.isArray(state.activities)) {
      throw new TypeError("Le format des données CarbTrack enregistrées est invalide.");
    }

    return {
      profile: state.profile,
      goal: state.goal,
      activities: state.activities
    };
  }

  save(state) {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      this.logger.error("Impossible d’enregistrer les données CarbTrack.", error);
      throw new Error("L’enregistrement local a échoué. Vérifiez l’espace disponible.", { cause: error });
    }
  }
}
