export class SaveWorkspace {
  constructor(stateRepository) {
    this.stateRepository = stateRepository;
  }

  execute(workspace) {
    this.stateRepository.save({
      profile: workspace.profile,
      goal: workspace.goal,
      activities: workspace.activities.map((activity) => activity.toJSON())
    });
  }
}
