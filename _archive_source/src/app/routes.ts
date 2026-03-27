import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { Dashboard } from "./pages/Dashboard";
import { Competitions } from "./pages/Competitions";
import { StudentData } from "./pages/StudentData";
import { CertificateProcessing } from "./pages/CertificateProcessing";
import { MatchReview } from "./pages/MatchReview";
import { DriveSync } from "./pages/DriveSync";
import { EmailCampaigns } from "./pages/EmailCampaigns";
import { Logs } from "./pages/Logs";
import { Settings } from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "competitions", Component: Competitions },
      { path: "students", Component: StudentData },
      { path: "certificates", Component: CertificateProcessing },
      { path: "match", Component: MatchReview },
      { path: "drive", Component: DriveSync },
      { path: "email", Component: EmailCampaigns },
      { path: "logs", Component: Logs },
      { path: "settings", Component: Settings },
    ],
  },
]);
