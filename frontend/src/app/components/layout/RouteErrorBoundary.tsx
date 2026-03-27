import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

import { Button } from "../ui/button";

export function RouteErrorBoundary() {
  const error = useRouteError();

  let title = "Something went wrong";
  let message = "The page could not be loaded. Try returning to the dashboard or refreshing the app.";
  let statusLabel = "";

  if (isRouteErrorResponse(error)) {
    statusLabel = `${error.status}`;
    if (error.status === 404) {
      title = "Page not found";
      message = "The requested page or file could not be found. Check the selected competition or retry the action.";
    } else if (typeof error.data === "string" && error.data.trim()) {
      message = error.data;
    } else if (error.statusText) {
      message = error.statusText;
    }
  } else if (error instanceof Error && error.message) {
    message = error.message;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-3">
            <div>
              {statusLabel ? <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{statusLabel}</p> : null}
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h1>
            </div>
            <p className="text-sm leading-6 text-slate-600">{message}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reload
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
