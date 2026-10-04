"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  checkoutConsentService,
  type CheckoutConsentContext,
  type CheckoutDocument,
  type CheckoutDocumentType,
} from "@/services/checkout-consent.service";

const documentDefinitions: Array<{
  type: CheckoutDocumentType;
  name: string;
  purpose: string;
  title: string;
  content: string;
}> = [
  {
    type: "TICKETING_TERMS",
    name: "Ticketing Terms",
    purpose: "Required commercial terms accepted before Ticket payment.",
    title: "Fictional local Ticketing Terms",
    content:
      "LOCAL TEST DOCUMENT — NOT LEGALLY APPROVED\n\nThese fictional terms are provided only to test Glacier's versioning, presentation and acceptance workflow. Replace them with approved Event terms before production use.",
  },
  {
    type: "PRIVACY_NOTICE",
    name: "Privacy Collection Notice",
    purpose: "Explains the collection needed to fulfil the Booking.",
    title: "Fictional local Privacy Collection Notice",
    content:
      "LOCAL TEST DOCUMENT — NOT LEGALLY APPROVED\n\nThis fictional notice is provided only to test Glacier's privacy-notice workflow. Replace it with an approved collection notice and retention position before production use.",
  },
  {
    type: "MARKETING_DISCLOSURE",
    name: "Marketing Choice",
    purpose: "Optional adult-only permission, separate from the purchase.",
    title: "Fictional local Marketing Disclosure",
    content:
      "LOCAL TEST DOCUMENT — NOT LEGALLY APPROVED\n\nThis fictional disclosure is provided only to test an optional, initially unchecked marketing choice. No messages are sent and no delivery provider is configured.",
  },
];

export function CheckoutDocumentSettings({ eventId }: { eventId: string }) {
  const [context, setContext] = useState<CheckoutConsentContext | null>(null);
  const [editing, setEditing] = useState<CheckoutDocumentType | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setContext(await checkoutConsentService.context(eventId));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load checkout documents.",
      );
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const preview = useMemo(
    () => context?.documents.find(({ id }) => id === previewId) ?? null,
    [context, previewId],
  );

  function beginDraft(type: CheckoutDocumentType) {
    const definition = documentDefinitions.find((item) => item.type === type)!;
    setEditing(type);
    setPreviewId(null);
    setForm({ title: definition.title, content: definition.content });
    setError(null);
  }

  async function saveDraft() {
    if (!editing) return;
    try {
      setBusy(true);
      setError(null);
      const document = await checkoutConsentService.createDraft(eventId, {
        type: editing,
        title: form.title,
        content: form.content,
        testOnly: true,
      });
      setEditing(null);
      await load();
      setPreviewId(document.id);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save the draft.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function publish(document: CheckoutDocument) {
    try {
      setBusy(true);
      setError(null);
      await checkoutConsentService.publish(eventId, document.id);
      setPreviewId(null);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to publish the document.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Checkout evidence
          </p>
          <h3 className="mt-2 text-lg font-semibold">
            Terms, privacy and marketing choice
          </h3>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Create a draft, review the exact wording, then publish an immutable
            version for this Event.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${context?.readiness.readyForTicketCheckout ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}
        >
          {context?.readiness.readyForTicketCheckout
            ? "Checkout documents ready"
            : "Required documents missing"}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        Local templates are fictional test evidence only. Legal/privacy approval
        and production wording remain external launch gates.
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        {documentDefinitions.map((definition) => {
          const documents =
            context?.documents.filter(({ type }) => type === definition.type) ??
            [];
          const published = documents.find(
            ({ status }) => status === "PUBLISHED",
          );
          const draft = documents.find(({ status }) => status === "DRAFT");
          return (
            <article key={definition.type} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold">{definition.name}</h4>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-bold ${published ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}
                >
                  {published
                    ? `Published v${published.version}`
                    : "Not published"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {definition.purpose}
              </p>
              {draft ? (
                <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-950">
                  Draft v{draft.version} · review required before publication
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {draft ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPreviewId(draft.id)}
                  >
                    Review draft
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => beginDraft(definition.type)}
                  >
                    Create next draft
                  </Button>
                )}
                {published ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setPreviewId(published.id)}
                  >
                    View current
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {editing ? (
        <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <h4 className="font-semibold">Create test draft</h4>
          <label className="mt-4 block text-sm font-semibold">
            Document title
            <input
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 font-normal"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Exact wording
            <textarea
              className="mt-2 min-h-48 w-full rounded-lg border bg-background px-3 py-2 font-normal"
              value={form.content}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
            />
          </label>
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              disabled={busy || !form.title.trim() || !form.content.trim()}
              onClick={() => void saveDraft()}
            >
              Save draft for review
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {preview ? (
        <div className="mt-5 rounded-xl border p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Exact version preview
              </p>
              <h4 className="mt-2 text-lg font-semibold">{preview.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Version {preview.version} · {preview.status.toLowerCase()} ·
                test-only
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPreviewId(null)}
            >
              Close preview
            </Button>
          </div>
          <div className="mt-4 whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm leading-6">
            {preview.content}
          </div>
          {preview.status === "DRAFT" ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
              <p className="max-w-2xl text-sm text-amber-950">
                Publishing freezes this wording as the current local test
                version. A later change creates a new version rather than
                editing this evidence.
              </p>
              <Button
                type="button"
                disabled={busy}
                onClick={() => void publish(preview)}
              >
                Publish reviewed test version
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
