import { AnnualReport } from "../../domain/AnnualReport.js";

export class GenerateAnnualReport {
  execute(activities, year) {
    return new AnnualReport(
      year,
      activities.filter((activity) => activity.year === year)
    );
  }
}
