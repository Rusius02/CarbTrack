import { LoadDemoActivities } from "./application/use-cases/LoadDemoActivities.js";
import { ExportAnnualReport } from "./application/use-cases/ExportAnnualReport.js";
import { GenerateAnnualReport } from "./application/use-cases/GenerateAnnualReport.js";
import { LoadWorkspace } from "./application/use-cases/LoadWorkspace.js";
import { RecordActivity } from "./application/use-cases/RecordActivity.js";
import { RemoveActivity } from "./application/use-cases/RemoveActivity.js";
import { SaveWorkspace } from "./application/use-cases/SaveWorkspace.js";
import { UpdatePreferences } from "./application/use-cases/UpdatePreferences.js";
import { BrowserWorkspaceRepository } from "./infrastructure/persistence/BrowserWorkspaceRepository.js";
import { HttpWorkspaceRepository } from "./infrastructure/persistence/HttpWorkspaceRepository.js";
import { HostedCheckoutGateway } from "./infrastructure/payments/HostedCheckoutGateway.js";
import { ActivityFormController } from "./presentation/ActivityFormController.js";
import { DashboardController } from "./presentation/DashboardController.js";
import { DashboardView } from "./presentation/DashboardView.js";

const stateRepository = window.CARBTRACK_STORAGE_MODE === "browser"
  ? new BrowserWorkspaceRepository(window.localStorage)
  : new HttpWorkspaceRepository({ legacyStorage: window.localStorage });
const saveWorkspace = new SaveWorkspace(stateRepository);
const loadWorkspace = new LoadWorkspace(stateRepository);
const generateAnnualReport = new GenerateAnnualReport();
const dashboardView = new DashboardView(document);

const controller = new DashboardController({
  view: dashboardView,
  loadWorkspace,
  recordActivity: new RecordActivity({ saveWorkspace }),
  removeActivity: new RemoveActivity(saveWorkspace),
  updatePreferences: new UpdatePreferences(saveWorkspace),
  generateAnnualReport,
  exportAnnualReport: new ExportAnnualReport(generateAnnualReport),
  loadDemoActivities: new LoadDemoActivities({ saveWorkspace }),
  checkoutGateway: new HostedCheckoutGateway(window.CARBTRACK_CHECKOUT_URLS),
  window
});

try {
  await controller.start();
  new ActivityFormController({
    view: dashboardView,
    recordActivity: controller.recordActivity,
    getWorkspace: () => controller.workspace,
    getYear: () => dashboardView.getSelectedYear(),
    onChange: (workspace) => controller.onChange(workspace),
    onError: (error) => controller.onError(error),
    enqueueMutation: (operation) => controller.enqueueMutation(operation)
  }).bind();
} catch (error) {
  console.error("CarbTrack n’a pas pu démarrer.", error);
}
