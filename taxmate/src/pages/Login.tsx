import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Lock, Mail } from "lucide-react";

export default function Login() {
  const { user, ready, login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user) {
      setLocation("/account");
    }
  }, [ready, user, setLocation]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const success = login(email, password);
    setSubmitting(false);

    if (!success) {
      setError("Use a valid email and a password with at least 6 characters.");
      return;
    }

    setLocation("/account");
  }

  return (
    <AppLayout title="Login">
      <div className="px-5 pb-10 pt-6 space-y-6">
        <div className="rounded-[2rem] bg-white border border-border/70 p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground mb-2">Dashboard access</p>
            <h1 className="text-2xl font-bold text-foreground">Sign in to your personal account</h1>
            <p className="text-sm text-muted-foreground mt-2">Access your private TaxMate dashboard and keep your numbers secure.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm text-muted-foreground">
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>

            <label className="block text-sm text-muted-foreground">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <div className="rounded-[2rem] bg-white border border-border/70 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <Mail className="w-4 h-4" />
            <span>Secure local login</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            This login is stored locally in your browser so you can protect access to the dashboard while keeping the experience lightweight.
          </p>
          <div className="mt-5 rounded-2xl bg-primary/5 p-4 text-sm text-primary">
            <p className="font-semibold">Tip</p>
            <p className="mt-2">Use any valid email and password with at least 6 characters.</p>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            Not ready to sign in? <Link href="/" className="font-medium text-primary">Return home</Link>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
