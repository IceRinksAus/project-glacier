"use client";

import { CheckCircle2, Printer, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { use, useEffect, useState } from "react";

import {
  publicWaiverService,
  WaiverVerification,
} from "@/services/public-waiver.service";

export default function WaiverVerificationPage({
  params,
}: {
  params: Promise<{ verificationToken: string }>;
}) {
  const { verificationToken } = use(params);
  const [verification, setVerification] = useState<WaiverVerification | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    publicWaiverService
      .verify(verificationToken)
      .then((result) => {
        if (!cancelled) setVerification(result);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Waiver completion proof was not found.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [verificationToken]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#e9f7ff_0%,#f8fafc_45%)] px-4 py-12 text-slate-950 sm:py-20 print:bg-white print:p-0">
      <section className="mx-auto max-w-2xl rounded-3xl border bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-10 print:border-0 print:shadow-none">
        {!verification && !error ? <p>Checking waiver completion…</p> : null}
        {error ? (
          <div role="alert" className="text-center">
            <ShieldCheck className="mx-auto size-12 text-slate-400" />
            <h1 className="mt-4 text-2xl font-semibold">Proof unavailable</h1>
            <p className="mt-2 text-slate-600">{error}</p>
          </div>
        ) : null}
        {verification ? (
          <>
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-8 text-emerald-700" />
            </div>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
              Verified waiver completion
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {verification.eventName}
            </h1>
            <dl className="mt-6 grid gap-4 rounded-2xl border bg-slate-50 p-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Waiver
                </dt>
                <dd className="mt-1 font-semibold">
                  {verification.waiverTitle}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Version
                </dt>
                <dd className="mt-1 font-semibold">
                  {verification.waiverVersion}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Accepted
                </dt>
                <dd className="mt-1 font-semibold">
                  {new Date(verification.acceptedAt).toLocaleString("en-AU")}
                </dd>
              </div>
            </dl>
            <div className="mt-7 flex justify-center rounded-2xl border bg-white p-5">
              <Image
                src={verification.qrCodeDataUrl}
                alt="Waiver completion verification QR code"
                width={256}
                height={256}
                unoptimized
              />
            </div>
            <p className="mt-4 text-center text-sm leading-6 text-slate-600">
              Staff can scan this QR code to verify completion. It does not
              admit a Ticket or consume entry.
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-950 px-5 font-bold text-white print:hidden"
            >
              <Printer className="size-5" />
              Print or save proof
            </button>
          </>
        ) : null}
      </section>
    </main>
  );
}
