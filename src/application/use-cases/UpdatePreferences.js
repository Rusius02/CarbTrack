export class UpdatePreferences {
  constructor(saveWorkspace) {
    this.saveWorkspace = saveWorkspace;
  }

  execute(workspace, preferences) {
    const updatedWorkspace = { ...workspace, ...preferences };
    this.saveWorkspace.execute(updatedWorkspace);
    return updatedWorkspace;
  }
}
