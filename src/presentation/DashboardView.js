const CATEGORY_COLORS = Object.freeze({
  Transport: "#7fa27d",
  "Énergie": "#e4a36f",
  Alimentation: "#91b5a2",
  Achats: "#b1a3c7",
  Numérique: "#8faec5",
  Autre: "#c5cfc4"
});

export class DashboardView {
  constructor(document) {
    this.document = document;
    this.selectors = {
      workspaceAvatar: "#workspace-avatar",
      workspaceName: "#workspace-name",
      workspaceType: "#workspace-type",
      eyebrow: ".eyebrow",
      scopeField: "#scope-field",
      yearSelect: "#year-select",
      activityTable: ".activity-table",
      activityList: "#activity-list",
      emptyState: "#empty-state",
      totalEmissions: "#total-emissions",
      chartTotal: "#chart-total",
      activityCount: "#activity-count",
      allCount: "#all-count",
      tablePeriod: "#table-period",
      showingCount: "#showing-count",
      topCategory: "#top-category",
      topCategoryValue: "#top-category-value",
      topCategoryProgress: "#top-category-progress",
      topCategoryShare: "#top-category-share",
      categoryIcon: ".category-highlight .category-icon",
      goalInput: "#goal-input",
      goalValue: "#goal-value",
      goalRing: "#goal-ring",
      breakdownChart: "#breakdown-chart",
      legendList: "#legend-list",
      activityForm: "#activity-form",
      activityDialog: "#activity-dialog",
      checkoutStatus: "#checkout-status",
      appStatus: "#app-status"
    };
  }

  element(name) {
    const element = this.document.querySelector(this.selectors[name]);
    if (!element) throw new Error(`Élément d’interface manquant : ${this.selectors[name]}`);
    return element;
  }

  initializeYears(currentYear) {
    const select = this.element("yearSelect");
    for (let year = currentYear; year >= currentYear - 6; year -= 1) {
      const option = this.document.createElement("option");
      option.value = String(year);
      option.textContent = String(year);
      select.append(option);
    }
  }

  getSelectedYear() {
    return Number(this.element("yearSelect").value);
  }

  getActivityInput() {
    return Object.fromEntries(new FormData(this.element("activityForm")));
  }

  resetActivityForm() {
    this.element("activityForm").reset();
  }

  openActivityDialog() {
    this.element("activityDialog").showModal();
  }

  closeActivityDialog() {
    this.element("activityDialog").close();
  }

  showError(message) {
    this.element("appStatus").textContent = message;
    this.element("appStatus").hidden = false;
  }

  showCheckoutMessage(message) {
    this.element("checkoutStatus").textContent = message;
  }

  clearError() {
    this.element("appStatus").textContent = "";
    this.element("appStatus").hidden = true;
  }

  updateProfile(profile) {
    const organization = profile === "organization";
    this.element("workspaceAvatar").textContent = organization ? "E" : "P";
    this.element("workspaceName").textContent = organization ? "Mon espace entreprise" : "Mon espace perso";
    this.element("workspaceType").textContent = organization ? "Organisation" : "Particulier";
    this.element("eyebrow").innerHTML =
      `<span class="live-dot"></span> VOTRE BILAN ${organization ? "ORGANISATION" : "PERSONNEL"}`;
    this.element("scopeField").hidden = !organization;
  }

  render({ report, workspace, filteredActivities }) {
    this.clearError();
    const total = report.totalEmissions;
    const [topCategory, topValue] = report.leadingCategory;
    const progress = workspace.goal > 0 ? Math.min(total / workspace.goal * 100, 100) : 0;

    this.element("totalEmissions").textContent = this.formatNumber(total);
    this.element("chartTotal").textContent = this.formatNumber(total);
    this.element("activityCount").textContent = `${report.activities.length} activité${report.activities.length > 1 ? "s" : ""}`;
    this.element("allCount").textContent = String(report.activities.length);
    this.element("tablePeriod").textContent = `Année ${report.year}`;
    this.element("showingCount").textContent =
      `${filteredActivities.length} activité${filteredActivities.length > 1 ? "s" : ""}`;
    this.element("emptyState").classList.toggle("visible", filteredActivities.length === 0);
    this.element("activityTable").hidden = filteredActivities.length === 0;
    this.renderLeadingCategory(topCategory, topValue, total);
    this.renderGoal(workspace.goal, progress);
    this.renderActivities(filteredActivities, workspace.profile);
    this.renderBreakdown(report);
  }

  renderLeadingCategory(category, value, total) {
    const hasEmissions = value > 0;
    this.element("topCategory").textContent = hasEmissions ? category : "À découvrir";
    this.element("topCategoryValue").textContent = hasEmissions
      ? `${this.formatNumber(value)} kgCO₂e`
      : "Enregistrez une activité";
    this.element("topCategoryProgress").style.width =
      hasEmissions ? `${value / total * 100}%` : "0";
    this.element("topCategoryShare").textContent =
      hasEmissions ? `${this.formatNumber(value / total * 100, 0)} %` : "—";
    if (hasEmissions) {
      this.element("categoryIcon").style.backgroundColor = `${CATEGORY_COLORS[category]}25`;
      this.element("categoryIcon").style.color = CATEGORY_COLORS[category];
    }
  }

  renderGoal(goal, progress) {
    this.element("goalInput").value = String(goal);
    this.element("goalValue").textContent = `${this.formatNumber(progress, 0)}%`;
    this.element("goalRing").style.background =
      `conic-gradient(#79a27c ${progress}%, #edf1ec ${progress}% 100%)`;
  }

  renderActivities(activities, profile) {
    const body = this.element("activityList");
    body.replaceChildren();
    for (const activity of activities) {
      const row = this.document.createElement("tr");
      const categoryLabel = profile === "organization"
        ? `${activity.category} · ${activity.scope}`
        : activity.category;
      const values = [
        { className: "", content: this.createActivityName(activity) },
        { className: "", content: this.createCategoryChip(categoryLabel) },
        { className: "", text: `${this.formatNumber(activity.quantity)} ${activity.unit}` },
        { className: "activity-emissions", text: `${this.formatNumber(activity.emissions)} kg` },
        { className: "", content: this.createDeleteButton(activity) }
      ];

      for (const value of values) {
        const cell = this.document.createElement("td");
        if (value.className) cell.className = value.className;
        if (value.content) cell.append(value.content);
        else cell.textContent = value.text;
        row.append(cell);
      }
      body.append(row);
    }
  }

  createActivityName(activity) {
    const container = this.document.createElement("span");
    container.className = "activity-name";
    const dot = this.document.createElement("span");
    dot.className = "activity-dot";
    dot.style.setProperty("--dot", CATEGORY_COLORS[activity.category]);
    const name = this.document.createTextNode(activity.name);
    container.append(dot, name);
    return container;
  }

  createCategoryChip(category) {
    const chip = this.document.createElement("span");
    chip.className = "category-chip";
    chip.textContent = category;
    return chip;
  }

  createDeleteButton(activity) {
    const button = this.document.createElement("button");
    button.className = "activity-delete";
    button.type = "button";
    button.dataset.delete = activity.id;
    button.setAttribute("aria-label", `Supprimer ${activity.name}`);
    button.title = "Supprimer";
    button.textContent = "×";
    return button;
  }

  renderBreakdown(report) {
    const totals = report.categoryTotals;
    const populated = [...totals.entries()]
      .filter(([, value]) => value > 0)
      .sort((left, right) => right[1] - left[1]);
    const segments = [];
    let start = 0;
    for (const [category, value] of populated) {
      const end = start + value / report.totalEmissions * 100;
      segments.push(`${CATEGORY_COLORS[category]} ${start}% ${end}%`);
      start = end;
    }

    this.element("breakdownChart").style.background = segments.length
      ? `conic-gradient(${segments.join(", ")})`
      : "conic-gradient(#e9eee8 0 100%)";

    const legend = this.element("legendList");
    legend.replaceChildren();
    const entries = populated.length ? populated : [["En attente de données", 0]];
    for (const [category, value] of entries) {
      const row = this.document.createElement("div");
      row.className = "legend-row";
      const swatch = this.document.createElement("span");
      swatch.className = "legend-swatch";
      swatch.style.setProperty("--swatch", CATEGORY_COLORS[category] || "#e9eee8");
      const label = this.document.createElement("span");
      label.textContent = category;
      const amount = this.document.createElement("strong");
      amount.textContent = `${this.formatNumber(value)} kg`;
      row.append(swatch, label, amount);
      legend.append(row);
    }
  }

  setFilterState(activeFilter) {
    this.document.querySelectorAll(".activity-tab").forEach((tab) => {
      tab.classList.toggle("selected", tab.dataset.filter === activeFilter);
    });
  }

  formatNumber(value, maximumFractionDigits = 1) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits }).format(value);
  }
}
