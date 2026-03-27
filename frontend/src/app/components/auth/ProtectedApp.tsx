import { Navigate, useLocation } from "react-router";

import { AppDataProvider } from "../../contexts/AppDataContext";
import { useAuth } from "../../contexts/AuthContext";
import { RootLayout } from "../layout/RootLayout";

export function ProtectedApp() {
  const location = useLocation();
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-6">
        <div className="rounded-3xl border bg-white px-8 py-6 text-sm text-stone-600 shadow-sm">
          Checking admin session...
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <AppDataProvider>
      <RootLayout />
    </AppDataProvider>
  );
}
