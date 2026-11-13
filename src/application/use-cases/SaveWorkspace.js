export class SaveWorkspace {
  constructor(stateRepository) {
    this.stateRepository = stateRepository;
  }

  async execute(workspace) {
    return this.stateRepository.save({
      profile: workspace.profile,
      goal: workspace.goal,
      activities: workspace.activities.map((activity) => activity.toJSON())
    });
  }
}
