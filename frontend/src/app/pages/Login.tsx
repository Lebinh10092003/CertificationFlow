import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { LockKeyhole, Trophy } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated, loading, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const redirectTo = (location.state as LocationState | null)?.from?.pathname || "/";

  if (!loading && authenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      await login(username, password);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#bfdbfe,_#eff6ff_35%,_#ffffff_100%)] px-6 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden rounded-[2rem] border border-blue-200 bg-slate-950 p-10 text-white shadow-[0_24px_100px_rgba(15,23,42,0.26)] lg:block">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-200">
              <Trophy className="h-6 w-6" />
            </div>
            <p className="mt-8 text-xs uppercase tracking-[0.35em] text-blue-200">Admin Access</p>
            <h1 className="mt-4 max-w-md text-4xl font-semibold tracking-tight">
              CertificationFlow control panel
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
              Sign in with a Django admin account to import student sheets, process certificates, review matches,
              and export approved public links.
            </p>
          </div>

          <Card className="border-blue-100 bg-white/95 shadow-[0_20px_80px_rgba(30,64,175,0.12)] backdrop-blur">
            <CardHeader className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-blue-700">Admin Sign In</p>
                <CardTitle className="mt-2 text-3xl text-slate-950">Login to continue</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    disabled={loading || submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    disabled={loading || submitting}
                  />
                </div>

                {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

                <Button className="w-full" type="submit" disabled={loading || submitting}>
                  {submitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
