"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { setAuthSession } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("jamie@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [challengeCode, setChallengeCode] = useState("");
  const [setup, setSetup] = useState<{
    secret: string;
    qrCodeDataUrl: string;
  } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  function finishAuthentication(data: {
    accessToken: string;
    user: { role: string };
  }) {
    setAuthSession(data.accessToken, data.user);
    router.push(data.user.role === "SCANNER" ? "/staff/scanner" : "/events");
  }

  async function performLogin(restartMfaEnrollment = false) {
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          restartMfaEnrollment,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await response.json();

      if (data.status === "AUTHENTICATED") {
        finishAuthentication(data);
      } else {
        setChallengeToken(data.challengeToken);
        setSetup(data.setup ?? null);
      }
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Unable to sign in",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await performLogin();
  }

  async function handleChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/auth/mfa/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken,
          code: challengeCode.replace(/\s/g, ""),
        }),
      });
      if (!response.ok) throw new Error("That code could not be verified.");
      const data = await response.json();
      if (data.recoveryCodes?.length) {
        setRecoveryCodes(data.recoveryCodes);
        setAuthSession(data.accessToken, data.user);
      } else {
        finishAuthentication(data);
      }
    } catch (challengeError) {
      setError(
        challengeError instanceof Error
          ? challengeError.message
          : "Unable to verify the code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (recoveryCodes.length) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,var(--accent),transparent_45%),var(--background)] px-6 py-10">
        <div className="w-full max-w-lg rounded-3xl border bg-card p-8 shadow-xl shadow-primary/10">
          <h1 className="text-3xl font-semibold tracking-tight">Save your recovery codes</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Store these somewhere safe. Each code works once and will not be shown again.
          </p>
          <ul className="mt-6 grid gap-2 rounded-xl border bg-muted/30 p-5 font-mono text-sm sm:grid-cols-2">
            {recoveryCodes.map((code) => <li key={code}>{code}</li>)}
          </ul>
          <Button className="mt-6 w-full" size="lg" onClick={() => router.push("/events")}>
            I have saved these codes
          </Button>
        </div>
      </main>
    );
  }

  if (challengeToken) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,var(--accent),transparent_45%),var(--background)] px-6 py-10">
        <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-xl shadow-primary/10">
          <p className="glacier-kicker">Glacier Platform</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {setup ? "Secure your account" : "Enter your security code"}
          </h1>
          {setup ? (
            <div className="mt-5 space-y-4 text-sm">
              <p>Scan this QR code with your authenticator app, then enter the six-digit code.</p>
              <p className="text-muted-foreground">
                If the code is about to change, wait for the next one. Restarting setup invalidates any earlier Glacier QR code.
              </p>
              {/* The setup secret is deliberately kept only in component memory. */}
              <img className="mx-auto size-60" src={setup.qrCodeDataUrl} alt="Authenticator setup QR code" />
              <p className="break-all rounded-lg border bg-muted/30 p-3 font-mono">{setup.secret}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Use your authenticator app or one unused recovery code.
            </p>
          )}
          <form className="mt-6 space-y-5" onSubmit={handleChallenge}>
            <label className="block text-sm font-medium" htmlFor="security-code">
              Security code
              <input
                id="security-code"
                value={challengeCode}
                onChange={(event) => setChallengeCode(event.target.value)}
                autoComplete="one-time-code"
                inputMode={setup ? "numeric" : "text"}
                className="mt-2 h-11 w-full rounded-lg border bg-background px-3 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </label>
            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Verifying…" : setup ? "Finish setup" : "Verify and sign in"}
            </Button>
            {setup ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => void performLogin(true)}
              >
                Restart authenticator setup
              </Button>
            ) : null}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,var(--accent),transparent_45%),var(--background)] px-6">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-xl shadow-primary/10">
        <div className="mb-8">
          <p className="glacier-kicker">
            Glacier Platform
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Sign in
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Access your organisation and events.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}
