export class DashboardController {
  constructor({
    view,
    loadWorkspace,
    recordActivity,
    removeActivity,
    updatePreferences,
    generateAnnualReport,
    exportAnnualReport,
    loadDemoActivities,
    checkoutGateway,
    window
  }) {
    Object.assign(this, {
      view,
      loadWorkspace,
      recordActivity,
      removeActivity,
      updatePreferences,
      generateAnnualReport,
      exportAnnualReport,
      loadDemoActivities,
      checkoutGateway,
      window
    });
    this.workspace = null;
    this.filter = "all";
    this.mutationQueue = Promise.resolve();
  }

  async start() {
    try {
      this.workspace = await this.loadWorkspace.execute();
    } catch (error) {
      this.view.showError(error.message);
      throw error;
    }

    this.view.initializeYears(new Date().getFullYear());
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const document = this.view.document;
    document.getElementById("workspace-switch").addEventListener("click", () => {
      const profile = this.workspace.profile === "personal" ? "organization" : "personal";
      void this.updateWorkspace({ profile });
    });
    document.getElementById("year-select").addEventListener("change", () => this.render());
    document.getElementById("goal-input").addEventListener("change", (event) => {
      const goal = Number(event.target.value);
      if (!Number.isFinite(goal) || goal <= 0) {
        event.target.value = String(this.workspace.goal);
        return;
      }
      void this.updateWorkspace({ goal });
    });
    document.getElementById("activity-list").addEventListener("click", (event) => {
      const button = event.target.closest("[data-delete]");
      if (button) void this.remove(button.dataset.delete);
    });
    document.querySelector(".activity-tabs").addEventListener("click", (event) => {
      const tab = event.target.closest("[data-filter]");
      if (!tab) return;
      this.filter = tab.dataset.filter;
      this.view.setFilterState(this.filter);
      this.render();
    });
    document.getElementById("example-button").addEventListener("click", () => void this.loadDemo());
    document.getElementById("export-button").addEventListener("click", () => this.export());
    document.querySelectorAll(".checkout-button").forEach((button) => {
      button.addEventListener("click", () => this.openCheckout(button.dataset.plan));
    });
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        document.querySelectorAll(".nav-link").forEach((item) => {
          item.classList.toggle("active", item === link);
        });
      });
    });
  }

  async updateWorkspace(preferences) {
    return this.enqueueMutation(async () => {
      try {
        this.workspace = await this.updatePreferences.execute(this.workspace, preferences);
        this.view.updateProfile(this.workspace.profile);
        this.view.clearError();
        this.render();
      } catch (error) {
        this.onError(error);
      }
    });
  }

  async remove(activityId) {
    return this.enqueueMutation(async () => {
      try {
        this.workspace = await this.removeActivity.execute(this.workspace, activityId);
        this.view.clearError();
        this.render();
      } catch (error) {
        this.onError(error);
      }
    });
  }

  async loadDemo() {
    return this.enqueueMutation(async () => {
      try {
        this.workspace = await this.loadDemoActivities.execute(this.workspace, this.view.getSelectedYear());
        this.view.clearError();
        this.render();
      } catch (error) {
        this.onError(error);
      }
    });
  }

  enqueueMutation(operation) {
    const operationPromise = this.mutationQueue.then(operation);
    this.mutationQueue = operationPromise.catch(() => {});
    return operationPromise;
  }

  export() {
    try {
      const csv = this.exportAnnualReport.execute(
        this.workspace.activities,
        this.view.getSelectedYear()
      );
      const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
      const url = this.window.URL.createObjectURL(blob);
      const link = this.view.document.createElement("a");
      link.href = url;
      link.download = `carbtrack-${this.view.getSelectedYear()}.csv`;
      link.click();
      this.window.setTimeout(() => this.window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      this.onError(error);
    }
  }

  openCheckout(plan) {
    const url = this.checkoutGateway.getCheckoutUrl(plan);
    if (!url) {
      this.view.showCheckoutMessage(
        "Paiement non activé : ajoutez votre lien Stripe hébergé dans window.CARBTRACK_CHECKOUT_URLS (voir README)."
      );
      return;
    }
    this.window.open(url, "_blank", "noopener,noreferrer");
  }

  render() {
    const report = this.generateAnnualReport.execute(
      this.workspace.activities,
      this.view.getSelectedYear()
    );
    const filteredActivities = this.filter === "all"
      ? report.activities
      : report.activities.filter((activity) => activity.category === this.filter);
    this.view.updateProfile(this.workspace.profile);
    this.view.render({ report, workspace: this.workspace, filteredActivities });
  }

  onChange(workspace) {
    this.workspace = workspace;
    this.view.clearError();
    this.render();
  }

  onError(error) {
    console.error("Une opération CarbTrack a échoué.", error);
    this.view.showError(error.message || "Une erreur inattendue est survenue.");
  }
}
