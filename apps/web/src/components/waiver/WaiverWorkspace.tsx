"use client";

import {
  CheckCircle2,
  ExternalLink,
  FileClock,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  EventWaiverAdministration,
  WaiverSubmissionDetail,
  WaiverSubmissionSummary,
  WaiverVersion,
  WaiverQrCode,
  waiverService,
} from "@/services/waiver.service";

interface WaiverWorkspaceProps {
  eventId: string;
  activityType: string | null;
  jurisdiction: string | null;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not published";
  }

  return new Date(value).toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusClasses(status: WaiverVersion["status"]) {
  if (status === "PUBLISHED") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "DRAFT") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-slate-100 text-slate-600";
}

export function WaiverWorkspace({
  eventId,
  activityType,
  jurisdiction,
}: WaiverWorkspaceProps) {
  const [waiver, setWaiver] = useState<EventWaiverAdministration | null>(null);
  const [submissions, setSubmissions] = useState<WaiverSubmissionSummary[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );
  const [selectedSubmission, setSelectedSubmission] =
    useState<WaiverSubmissionDetail | null>(null);
  const [qrCode, setQrCode] = useState<WaiverQrCode | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(
    async (submissionSearch?: string) => {
      try {
        setError(null);
        const [waiverResult, submissionResult] = await Promise.all([
          waiverService.findForEvent(eventId),
          waiverService.listSubmissions(eventId, submissionSearch),
        ]);
        setWaiver(waiverResult);
        setSubmissions(submissionResult);
        setSelectedVersionId(
          (current) => current ?? waiverResult?.versions[0]?.id ?? null,
        );
        const hasPublishedVersion = waiverResult?.versions.some(
          (version) => version.status === 'PUBLISHED',
        );
        setQrCode(
          hasPublishedVersion
            ? await waiverService.generatePublicQrCode(eventId)
            : null,
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load the Event waiver workspace.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [eventId],
  );

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadWorkspace]);

  const selectedVersion = useMemo(
    () =>
      waiver?.versions.find((version) => version.id === selectedVersionId) ??
      null,
    [selectedVersionId, waiver],
  );

  const publishedVersion =
    waiver?.versions.find((version) => version.status === "PUBLISHED") ?? null;
  const publicUrl =
    waiver && typeof window !== "undefined"
      ? `${window.location.origin}/waivers/${waiver.publicSlug}`
      : null;
  const generationReady = Boolean(activityType && jurisdiction);

  async function createDraft() {
    try {
      setIsMutating(true);
      setError(null);
      const draft = await waiverService.createDraft(eventId);
      await loadWorkspace(search);
      setSelectedVersionId(draft.id);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to generate the Waiver draft.",
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function publishDraft(versionId: string) {
    try {
      setIsMutating(true);
      setError(null);
      await waiverService.publishDraft(eventId, versionId);
      await loadWorkspace(search);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to publish the Waiver draft.",
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function searchSubmissions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    await loadWorkspace(search);
  }

  async function openSubmission(submissionId: string) {
    try {
      setError(null);
      const result = await waiverService.findSubmission(eventId, submissionId);
      setSelectedSubmission(result);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to load submission evidence.",
      );
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        Loading Waiver workspace…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="flex gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-950 text-white">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Event Waiver
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                {publishedVersion
                  ? "Published and available"
                  : waiver
                    ? "Draft configuration"
                    : "No Waiver configured"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Event Waivers are optional. When enabled, Glacier generates
                Event-specific wording from the approved activity and
                jurisdiction template.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void createDraft()}
            disabled={isMutating || !generationReady}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isMutating
              ? "Working…"
              : waiver
                ? "Generate new draft"
                : "Create Waiver"}
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Activity
            </p>
            <p className="mt-1 font-semibold">
              {activityType?.replaceAll("_", " ") ?? "Not configured"}
            </p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Jurisdiction
            </p>
            <p className="mt-1 font-semibold">
              {jurisdiction ?? "Not configured"}
            </p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Submissions
            </p>
            <p className="mt-1 font-semibold">{submissions.length}</p>
          </div>
        </div>

        {!generationReady ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Set the Event activity type and jurisdiction before generating a
            Waiver.
          </p>
        ) : null}

        {publicUrl && publishedVersion ? (
          <div className="mt-5 grid gap-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-center">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-900">
                Stable public Waiver link
              </p>
              <p className="mt-1 break-all text-sm text-emerald-800">
                {publicUrl}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white"
                >
                  Open public page
                  <ExternalLink className="size-4" />
                </a>
                {qrCode ? (
                  <a
                    href={qrCode.qrCodeDataUrl}
                    download={`event-waiver-${eventId}.png`}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-700 px-4 text-sm font-semibold text-emerald-900"
                  >
                    Download QR
                  </a>
                ) : null}
              </div>
            </div>
            {qrCode ? (
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <Image
                  src={qrCode.qrCodeDataUrl}
                  alt="QR code for the public Event Waiver"
                  width={512}
                  height={512}
                  unoptimized
                  className="size-full"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      {waiver ? (
        <div className="grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FileClock className="size-5 text-muted-foreground" />
              <h3 className="font-semibold">Version history</h3>
            </div>
            <div className="mt-4 space-y-2">
              {waiver.versions.map((version) => (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setSelectedVersionId(version.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedVersionId === version.id
                      ? "border-foreground bg-muted"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">
                      Version {version.version}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                        version.status,
                      )}`}
                    >
                      {version.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(version.publishedAt ?? version.createdAt)}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {selectedVersion ? (
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Version {selectedVersion.version} preview
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">
                    {selectedVersion.title}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Source: {selectedVersion.sourceTemplate.name}, revision{" "}
                    {selectedVersion.sourceTemplate.revision}
                  </p>
                </div>
                {selectedVersion.status === "DRAFT" ? (
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => void publishDraft(selectedVersion.id)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <CheckCircle2 className="size-4" />
                    Publish version
                  </button>
                ) : null}
              </div>
              <div className="mt-6 whitespace-pre-wrap rounded-xl border bg-background p-5 text-sm leading-7 text-muted-foreground">
                {selectedVersion.content}
              </div>
              <div className="mt-4 rounded-xl border bg-muted/30 p-4 text-sm leading-6">
                <span className="font-semibold">Acceptance:</span>{" "}
                {selectedVersion.acceptanceStatement}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Waiver submissions</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Search accepted Waivers by adult signatory name.
            </p>
          </div>
          <form onSubmit={searchSubmissions} className="flex gap-2">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <span className="sr-only">Search signatory name</span>
              <input
                value={search}
                maxLength={200}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search signatory"
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-64"
              />
            </label>
            <button
              type="submit"
              className="h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-muted"
            >
              Search
            </button>
          </form>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border">
          {submissions.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No Waiver submissions found.
            </p>
          ) : (
            submissions.map((submission) => (
              <button
                key={submission.id}
                type="button"
                onClick={() => void openSubmission(submission.id)}
                className="flex w-full flex-col justify-between gap-3 border-b p-4 text-left last:border-b-0 hover:bg-muted/40 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-semibold">
                    {submission.signatoryFullName}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Version {submission.waiverVersion.version} ·{" "}
                    {submission._count.minors} minors
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(submission.acceptedAt)}
                </p>
              </button>
            ))
          )}
        </div>
      </section>

      {selectedSubmission ? (
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Submission evidence
              </p>
              <h3 className="mt-1 text-xl font-semibold">
                {selectedSubmission.signatoryFullName}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Accepted {formatDateTime(selectedSubmission.acceptedAt)} against
                version {selectedSubmission.waiverVersion.version}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSubmission(null)}
              className="rounded-lg border px-3 py-2 text-sm font-semibold"
            >
              Close
            </button>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Electronic signature
              </p>
              <Image
                src={selectedSubmission.signatureData}
                alt={`Signature supplied by ${selectedSubmission.signatoryFullName}`}
                width={600}
                height={180}
                unoptimized
                className="mt-3 max-h-40 rounded-lg border bg-white object-contain"
              />
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Minors covered
              </p>
              {selectedSubmission.minors.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">None</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {selectedSubmission.minors.map((minor) => (
                    <li key={minor.id}>
                      <span className="font-semibold">{minor.fullName}</span>
                      {" — "}
                      {new Date(minor.dateOfBirth).toLocaleDateString("en-AU")}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
