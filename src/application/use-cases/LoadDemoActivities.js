import { Activity } from "../../domain/Activity.js";
import { DEMO_ACTIVITIES } from "../../domain/constants.js";

export class LoadDemoActivities {
  constructor({ saveWorkspace, createId = () => crypto.randomUUID() }) {
    this.saveWorkspace = saveWorkspace;
    this.createId = createId;
  }

  execute(workspace, year) {
    const activities = DEMO_ACTIVITIES.map((data) => new Activity({
      ...data,
      id: this.createId(),
      year,
      scope: "Scope 3"
    }));
    const updatedWorkspace = {
      ...workspace,
      activities: [...workspace.activities, ...activities]
    };
    this.saveWorkspace.execute(updatedWorkspace);
    return updatedWorkspace;
  }
}
