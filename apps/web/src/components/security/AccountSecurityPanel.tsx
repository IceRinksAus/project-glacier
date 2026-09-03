"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { clearAuthSession } from "@/lib/auth";
import {
  mfaSecurityService,
  type MfaStatus,
} from "@/services/mfa-security.service";

export function AccountSecurityPanel() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [rotation, setRotation] = useState<{
    challengeToken: string;
    setup: { secret: string; qrCodeDataUrl: string };
  } | null>(null);
  const [rotationCode, setRotationCode] = useState("");

  useEffect(() => {
    mfaSecurityService.status().then(setStatus).catch(() => setStatus(null));
  }, []);

  async function regenerate() {
    setMessage("");
    try {
      const result = await mfaSecurityService.regenerateCodes(password, code);
      setRecoveryCodes(result.recoveryCodes);
      setPassword("");
      setCode("");
      setStatus((current) => current ? { ...current, remainingRecoveryCodes: result.recoveryCodes.length } : current);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to regenerate recovery codes.");
    }
  }

  async function startRotation() {
    setMessage("");
    try {
      setRotation(await mfaSecurityService.startRotation(password, code));
      setPassword("");
      setCode("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start replacement.");
    }
  }

  async function confirmRotation() {
    if (!rotation) return;
    setMessage("");
    try {
      const result = await mfaSecurityService.confirmRotation(rotation.challengeToken, rotationCode);
      setRecoveryCodes(result.recoveryCodes);
      clearAuthSession();
      setMessage("Authenticator replaced. Save the codes, then sign in again.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to confirm replacement.");
    }
  }

  if (!status?.required) return null;

  return (
    <section aria-labelledby="account-security-heading" className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 id="account-security-heading" className="text-xl font-semibold">Account security</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Authenticator protection is active. {status.remainingRecoveryCodes} unused recovery codes remain.
      </p>

      {recoveryCodes.length ? (
        <div className="mt-5 rounded-lg border p-4">
          <p className="font-medium">Save these new recovery codes now</p>
          <ul className="mt-3 grid gap-1 font-mono text-sm sm:grid-cols-2">
            {recoveryCodes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ) : null}

      {rotation ? (
        <div className="mt-5 space-y-4 rounded-lg border p-4">
          <p className="font-medium">Confirm the replacement authenticator</p>
          <img src={rotation.setup.qrCodeDataUrl} alt="Replacement authenticator QR code" className="size-52" />
          <p className="break-all font-mono text-sm">{rotation.setup.secret}</p>
          <input aria-label="Replacement authenticator code" value={rotationCode} onChange={(event) => setRotationCode(event.target.value)} className="h-10 w-full rounded-lg border px-3" />
          <Button onClick={confirmRotation}>Replace authenticator</Button>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Current password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-10 w-full rounded-lg border px-3 font-normal" />
          </label>
          <label className="text-sm font-medium">Authenticator or recovery code
            <input value={code} onChange={(event) => setCode(event.target.value)} className="mt-2 h-10 w-full rounded-lg border px-3 font-mono font-normal" />
          </label>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button onClick={regenerate}>Generate new recovery codes</Button>
            <Button variant="outline" onClick={startRotation}>Replace authenticator</Button>
          </div>
        </div>
      )}
      {message ? <p role="status" className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}
