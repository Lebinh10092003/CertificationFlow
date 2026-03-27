import { createBrowserRouter } from "react-router";
import { ProtectedApp } from "./components/auth/ProtectedApp";
import { RouteErrorBoundary } from "./components/layout/RouteErrorBoundary";
import { Dashboard } from "./pages/Dashboard";
import { Competitions } from "./pages/Competitions";
import { StudentData } from "./pages/StudentData";
import { CertificateProcessing } from "./pages/CertificateProcessing";
import { MatchReview } from "./pages/MatchReview";
import { ExportCertificates } from "./pages/DriveSync";
import { EmailCampaigns } from "./pages/EmailCampaigns";
import { Logs } from "./pages/Logs";
import { PublicCertificate } from "./pages/PublicCertificate";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";

export const router = createBrowserRouter([
  {
    path: "/c/:slug",
    Component: PublicCertificate,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: "/login",
    Component: Login,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: "/",
    Component: ProtectedApp,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      { index: true, Component: Dashboard },
      { path: "competitions", Component: Competitions },
      { path: "students", Component: StudentData },
      { path: "certificates", Component: CertificateProcessing },
      { path: "match", Component: MatchReview },
      { path: "export", Component: ExportCertificates },
      { path: "email", Component: EmailCampaigns },
      { path: "logs", Component: Logs },
      { path: "settings", Component: Settings },
    ],
  },
]);
