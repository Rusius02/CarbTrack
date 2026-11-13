import { Activity } from "../../domain/Activity.js";

export class RecordActivity {
  constructor({ saveWorkspace, createId = () => crypto.randomUUID() }) {
    this.saveWorkspace = saveWorkspace;
    this.createId = createId;
  }

  execute({ workspace, input, year }) {
    const activity = new Activity({
      ...input,
      id: this.createId(),
      quantity: Number(input.quantity),
      factor: Number(input.factor),
      name: String(input.name).trim(),
      unit: String(input.unit).trim(),
      year,
      scope: workspace.profile === "organization" ? input.scope : "Scope 3"
    });
    const updatedWorkspace = {
      ...workspace,
      activities: [...workspace.activities, activity]
    };
    this.saveWorkspace.execute(updatedWorkspace);
    return { workspace: updatedWorkspace, activity };
  }
}
