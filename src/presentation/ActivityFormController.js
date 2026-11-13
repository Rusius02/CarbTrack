export class ActivityFormController {
  constructor({ view, recordActivity, getWorkspace, getYear, onChange, onError }) {
    this.view = view;
    this.recordActivity = recordActivity;
    this.getWorkspace = getWorkspace;
    this.getYear = getYear;
    this.onChange = onChange;
    this.onError = onError;
  }

  bind() {
    for (const id of ["add-activity-top", "add-activity-inline", "empty-add-button"]) {
      this.view.document.getElementById(id).addEventListener("click", () => {
        this.view.resetActivityForm();
        this.view.openActivityDialog();
      });
    }
    this.view.document.getElementById("cancel-dialog")
      .addEventListener("click", () => this.view.closeActivityDialog());
    this.view.element("activityForm").addEventListener("submit", (event) => {
      event.preventDefault();
      this.submit();
    });
  }

  submit() {
    try {
      const result = this.recordActivity.execute({
        workspace: this.getWorkspace(),
        input: this.view.getActivityInput(),
        year: this.getYear()
      });
      this.onChange(result.workspace);
      this.view.closeActivityDialog();
      this.view.clearError();
    } catch (error) {
      this.onError(error);
    }
  }
}
