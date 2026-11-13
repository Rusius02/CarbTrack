export class RemoveActivity {
  constructor(saveWorkspace) {
    this.saveWorkspace = saveWorkspace;
  }

  async execute(workspace, activityId) {
    const activities = workspace.activities.filter((activity) => activity.id !== activityId);
    if (activities.length === workspace.activities.length) return workspace;
    const updatedWorkspace = { ...workspace, activities };
    await this.saveWorkspace.execute(updatedWorkspace);
    return updatedWorkspace;
  }
}
