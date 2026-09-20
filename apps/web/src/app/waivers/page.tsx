"use client";

import {
  CalendarCheck2,
  CheckCircle2,
  FileClock,
  FileSignature,
  Scale,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import {
  FormEvent,
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";
import {
  getAuthRoleSnapshot,
  getServerAuthRoleSnapshot,
  subscribeAuthSession,
} from "@/lib/auth";
import { eventService, GlacierEvent } from "@/services/event.service";
import {
  CreateWaiverTemplate,
  WaiverTemplate,
  waiverTemplateService,
} from "@/services/waiver-template.service";

const jurisdictions: CreateWaiverTemplate["jurisdiction"][] = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
];

const emptyDraft: CreateWaiverTemplate = {
  name: "",
  activityType: "ICE_SKATING",
  jurisdiction: "NSW",
  contentTemplate: "",
  acceptanceStatement: "",
  legislationReferences: [],
};

export default function WaiversPage() {
  const role = useSyncExternalStore(
    subscribeAuthSession,
    getAuthRoleSnapshot,
    getServerAuthRoleSnapshot,
  );
  const [templates, setTemplates] = useState<WaiverTemplate[]>([]);
  const [events, setEvents] = useState<GlacierEvent[]>([]);
  const [draft, setDraft] = useState<CreateWaiverTemplate>(emptyDraft);
  const [approvalReferences, setApprovalReferences] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function reload() {
    const [nextTemplates, nextEvents] = await Promise.all([
      waiverTemplateService.list(),
      eventService.getEvents(),
    ]);
    setTemplates(nextTemplates);
    setEvents(nextEvents);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([waiverTemplateService.list(), eventService.getEvents()])
      .then(([nextTemplates, nextEvents]) => {
        if (!cancelled) {
          setTemplates(nextTemplates);
          setEvents(nextEvents);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load the Waivers workspace.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function createTemplate(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      await waiverTemplateService.create({
        ...draft,
        name: draft.name.trim(),
        contentTemplate: draft.contentTemplate.trim(),
        acceptanceStatement: draft.acceptanceStatement.trim(),
      });
      setDraft(emptyDraft);
      await reload();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create the template draft.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function approveTemplate(templateId: string) {
    const reference = approvalReferences[templateId]?.trim();
    if (!reference) {
      setError("Add the legal or organisational approval reference first.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await waiverTemplateService.approve(templateId, reference);
      await reload();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to approve the template.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const approvedCount = templates.filter(
    (template) => template.status === "APPROVED",
  ).length;
  const configuredEvents = events.filter(
    (event) => event.activityType && event.jurisdiction,
  ).length;

  return (
    <PlatformShell>
      <div className="space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Safety and participation
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Waivers
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Manage approved wording centrally, then configure and monitor each
            Event from its own Waiver workspace.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={Scale}
            label="Approved templates"
            value={approvedCount}
          />
          <SummaryCard
            icon={CalendarCheck2}
            label="Configured Events"
            value={`${configuredEvents} of ${events.length}`}
          />
          <SummaryCard
            icon={FileSignature}
            label="Template drafts"
            value={
              templates.filter((template) => template.status === "DRAFT").length
            }
          />
        </section>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">
                Approval evidence is required before use
              </p>
              <p className="mt-1 leading-6">
                Historical waiver wording is source material only. Glacier does
                not mark it legally approved until an OWNER records the review
                authority or approval reference. Current-law and privacy review
                remain external evidence.
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        ) : null}
        {isLoading ? (
          <div className="rounded-xl border bg-card p-6">Loading Waivers…</div>
        ) : null}

        {!isLoading ? (
          <section
            className="space-y-4"
            aria-labelledby="event-waivers-heading"
          >
            <div>
              <p className="text-sm font-semibold text-primary">
                Event operation
              </p>
              <h2
                id="event-waivers-heading"
                className="mt-1 text-2xl font-semibold"
              >
                Event Waivers
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Open an Event to publish its wording, display its public QR code
                and review submissions.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-xl border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {event.activityType?.replaceAll("_", " ") ??
                          "Activity not set"}{" "}
                        · {event.jurisdiction ?? "Jurisdiction not set"}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {event.status}
                    </span>
                  </div>
                  <Link
                    href={`/events/${event.id}?tab=Waiver`}
                    className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
                  >
                    Open Event Waiver
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!isLoading ? (
          <section
            className="space-y-4 border-t pt-8"
            aria-labelledby="template-library-heading"
          >
            <div>
              <p className="text-sm font-semibold text-primary">
                Organisation governance
              </p>
              <h2
                id="template-library-heading"
                className="mt-1 text-2xl font-semibold"
              >
                Template library
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Templates are versioned by activity and Australian jurisdiction.
                Approved wording is copied into an immutable Event version when
                published.
              </p>
            </div>
            <div className="grid gap-4">
              {templates.length === 0 ? (
                <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                  No templates are available yet.
                </div>
              ) : null}
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  canApprove={role === "OWNER"}
                  approvalReference={approvalReferences[template.id] ?? ""}
                  onApprovalReference={(value) =>
                    setApprovalReferences((current) => ({
                      ...current,
                      [template.id]: value,
                    }))
                  }
                  onApprove={() => void approveTemplate(template.id)}
                  isSaving={isSaving}
                />
              ))}
            </div>
          </section>
        ) : null}

        {role === "OWNER" ? (
          <section className="border-t pt-8">
            <form
              onSubmit={createTemplate}
              className="rounded-2xl border bg-card p-6 shadow-sm"
            >
              <div className="flex gap-3">
                <FileClock className="mt-1 size-5 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">
                    Create template draft
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Drafts cannot be used by Events until separately approved.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Template name">
                  <input
                    required
                    minLength={3}
                    maxLength={160}
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border bg-background px-3"
                  />
                </Field>
                <Field label="Jurisdiction">
                  <select
                    value={draft.jurisdiction}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        jurisdiction: event.target
                          .value as CreateWaiverTemplate["jurisdiction"],
                      }))
                    }
                    className="h-11 w-full rounded-lg border bg-background px-3"
                  >
                    {jurisdictions.map((jurisdiction) => (
                      <option key={jurisdiction}>{jurisdiction}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Waiver wording" wide>
                  <textarea
                    required
                    minLength={20}
                    maxLength={100000}
                    rows={9}
                    value={draft.contentTemplate}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        contentTemplate: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border bg-background p-3"
                    placeholder="Insert reviewed wording and supported Event variables."
                  />
                </Field>
                <Field label="Mandatory acceptance statement" wide>
                  <textarea
                    required
                    minLength={5}
                    maxLength={10000}
                    rows={3}
                    value={draft.acceptanceStatement}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        acceptanceStatement: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border bg-background p-3"
                  />
                </Field>
              </div>
              <Button className="mt-5" type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : "Save draft"}
              </Button>
            </form>
          </section>
        ) : null}
      </div>
    </PlatformShell>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Scale;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <Icon className="size-5 text-primary" />
      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function TemplateCard({
  template,
  canApprove,
  approvalReference,
  onApprovalReference,
  onApprove,
  isSaving,
}: {
  template: WaiverTemplate;
  canApprove: boolean;
  approvalReference: string;
  onApprovalReference: (value: string) => void;
  onApprove: () => void;
  isSaving: boolean;
}) {
  const isApproved = template.status === "APPROVED";
  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{template.name}</h3>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isApproved ? "bg-emerald-100 text-emerald-800" : template.status === "DRAFT" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}
            >
              {template.status}
            </span>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
              {template.authority === "ORGANIZATION"
                ? "Organisation"
                : "Platform"}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {template.jurisdiction} ·{" "}
            {template.activityType.replaceAll("_", " ")} · revision{" "}
            {template.revision}
          </p>
          {template.approvalReference ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-emerald-800">
              <CheckCircle2 className="size-4" />
              Approved: {template.approvalReference}
            </p>
          ) : null}
        </div>
        {template.status === "DRAFT" && canApprove ? (
          <div className="w-full md:max-w-md">
            <label className="text-sm font-medium">
              Approval reference
              <input
                value={approvalReference}
                onChange={(event) => onApprovalReference(event.target.value)}
                placeholder="Reviewer, advice or approval record"
                className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"
              />
            </label>
            <Button
              type="button"
              className="mt-3"
              disabled={isSaving}
              onClick={onApprove}
            >
              Approve template
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Field({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`text-sm font-medium ${wide ? "sm:col-span-2" : ""}`}>
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}
