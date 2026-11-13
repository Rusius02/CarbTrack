export class UpdatePreferences {
  constructor(saveWorkspace) {
    this.saveWorkspace = saveWorkspace;
  }

  async execute(workspace, preferences) {
    const updatedWorkspace = { ...workspace, ...preferences };
    await this.saveWorkspace.execute(updatedWorkspace);
    return updatedWorkspace;
  }
}
