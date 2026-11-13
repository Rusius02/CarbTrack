import { Activity } from "../../domain/Activity.js";
import { DEFAULT_ANNUAL_GOAL } from "../../domain/constants.js";

export class LoadWorkspace {
  constructor(stateRepository) {
    this.stateRepository = stateRepository;
  }

  async execute() {
    const savedState = await this.stateRepository.load();
    return {
      profile: savedState.profile === "organization" ? "organization" : "personal",
      goal: Number.isFinite(savedState.goal) && savedState.goal > 0
        ? savedState.goal
        : DEFAULT_ANNUAL_GOAL,
      activities: savedState.activities.map((activity) => Activity.fromJSON(activity)),
      initialized: savedState.initialized
    };
  }
}
