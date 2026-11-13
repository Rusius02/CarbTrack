export class ExportAnnualReport {
  constructor(generateAnnualReport) {
    this.generateAnnualReport = generateAnnualReport;
  }

  execute(activities, year) {
    const report = this.generateAnnualReport.execute(activities, year);
    const rows = [[
      "Année",
      "Activité",
      "Catégorie",
      "Périmètre",
      "Quantité",
      "Unité",
      "Facteur kgCO2e/unité",
      "Émissions kgCO2e"
    ]];

    for (const activity of report.activities) {
      rows.push([
        activity.year,
        activity.name,
        activity.category,
        activity.scope,
        activity.quantity,
        activity.unit,
        activity.factor,
        activity.emissions
      ]);
    }

    return rows.map((row) => row.map(escapeSpreadsheetValue).join(";")).join("\r\n");
  }
}

function escapeSpreadsheetValue(value) {
  const text = String(value);
  const safeText = /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}
