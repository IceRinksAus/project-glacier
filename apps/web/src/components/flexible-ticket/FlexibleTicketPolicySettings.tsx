"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getAuthUser } from "@/lib/auth";
import {
  FlexibleTicketEventContext,
  FlexibleTicketEventMode,
  FlexibleTicketPolicy,
  FlexibleTicketPolicyContext,
  FlexibleTicketPolicyInput,
  flexibleTicketPolicyService,
} from "@/services/flexible-ticket-policy.service";

const initialPolicy: FlexibleTicketPolicyInput = {
  available: true,
  feeType: "FIXED",
  feeValue: 5,
  allowsSessionChange: true,
  allowsRefundRequest: true,
  cutoffMinutesBeforeSession: 1440,
  permittedUseLimit: 1,
  priceIncreaseTreatment: "CUSTOMER_PAYS_DIFFERENCE",
  priceDecreaseTreatment: "KEEP_ORIGINAL_PRICE",
  feeRefundability: "NON_REFUNDABLE",
  customerSummary:
    "Change your Session or request an eligible cancellation before the stated cut-off.",
  materialTerms:
    "Flexible Ticket requests must be made before the stated cut-off and remain subject to availability and applicable law.",
};

export function OrganizationFlexibleTicketSettings() {
  const [context, setContext] = useState<FlexibleTicketPolicyContext | null>(
    null,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    setContext(await flexibleTicketPolicyService.organization());
  }

  useEffect(() => {
    void reload().catch((requestError: unknown) =>
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load Flexible Ticket policy.",
      ),
    );
  }, []);

  async function createDraft(input: FlexibleTicketPolicyInput) {
    setBusy(true);
    setError("");
    try {
      await flexibleTicketPolicyService.createOrganizationDraft(input);
      await reload();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create draft.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function publish(policyId: string) {
    setBusy(true);
    setError("");
    try {
      await flexibleTicketPolicyService.publishOrganization(policyId);
      await reload();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to publish policy.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <PolicyWorkspace
      title="Flexible Ticket default"
      description="Set the Organisation default used by Events that inherit this policy."
      context={context}
      error={error}
      busy={busy}
      onCreate={createDraft}
      onPublish={publish}
    />
  );
}

export function EventFlexibleTicketSettings({ eventId }: { eventId: string }) {
  const [context, setContext] = useState<FlexibleTicketEventContext | null>(
    null,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const owner = getAuthUser()?.role === "OWNER";

  async function reload() {
    setContext(await flexibleTicketPolicyService.event(eventId));
  }
  useEffect(() => {
    void reload().catch((requestError: unknown) =>
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load Flexible Ticket policy.",
      ),
    );
  }, [eventId]);

  async function changeMode(mode: FlexibleTicketEventMode) {
    setBusy(true);
    setError("");
    try {
      await flexibleTicketPolicyService.updateEventMode(eventId, mode);
      await reload();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to change Event policy mode.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function createDraft(input: FlexibleTicketPolicyInput) {
    setBusy(true);
    setError("");
    try {
      await flexibleTicketPolicyService.createEventDraft(eventId, input);
      await reload();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create Event draft.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function publish(policyId: string) {
    setBusy(true);
    setError("");
    try {
      await flexibleTicketPolicyService.publishEvent(eventId, policyId);
      await reload();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to publish Event policy.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border bg-card p-6">
      <p className="text-sm font-medium text-muted-foreground">
        Customer options
      </p>
      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-2xl font-semibold">Flexible Ticket</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Choose whether this Event inherits the Organisation default, uses
            its own published policy, or does not offer Flexible Ticket.
          </p>
        </div>
        {context ? (
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${context.ready ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}
          >
            {context.ready ? "Ready" : "Configuration required"}
          </span>
        ) : null}
      </div>
      {context ? (
        <>
          <fieldset
            className="mt-6 grid gap-3 sm:grid-cols-3"
            disabled={!owner || busy}
          >
            {(["INHERIT", "OVERRIDE", "DISABLED"] as const).map((mode) => (
              <label
                key={mode}
                className="flex cursor-pointer gap-3 rounded-lg border p-4"
              >
                <input
                  type="radio"
                  name="flexible-mode"
                  checked={context.event.flexibleTicketMode === mode}
                  onChange={() => void changeMode(mode)}
                />
                <span>
                  <strong>
                    {mode === "INHERIT"
                      ? "Inherit default"
                      : mode === "OVERRIDE"
                        ? "Event override"
                        : "Not offered"}
                  </strong>
                </span>
              </label>
            ))}
          </fieldset>
          {!owner ? (
            <p className="mt-3 text-sm text-muted-foreground">
              You can inspect this policy, but only the Organisation Owner can
              change it.
            </p>
          ) : null}
          <div className="mt-5">
            <PolicySummary
              policy={context.effectivePolicy}
              empty={
                context.event.flexibleTicketMode === "DISABLED"
                  ? "Flexible Ticket is deliberately unavailable for this Event."
                  : "No effective published policy is available."
              }
            />
          </div>
          {context.event.flexibleTicketMode === "OVERRIDE" ? (
            <div className="mt-6">
              <PolicyWorkspace
                title="Event override"
                description="This version applies only to future Flexible Ticket purchases for this Event."
                context={context.override}
                error={error}
                busy={busy}
                readOnly={!owner}
                onCreate={createDraft}
                onPublish={publish}
              />
            </div>
          ) : null}
        </>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          Loading Flexible Ticket settings…
        </p>
      )}
      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function PolicyWorkspace({
  title,
  description,
  context,
  error,
  busy,
  readOnly = false,
  onCreate,
  onPublish,
}: {
  title: string;
  description: string;
  context: FlexibleTicketPolicyContext | null;
  error: string;
  busy: boolean;
  readOnly?: boolean;
  onCreate: (input: FlexibleTicketPolicyInput) => Promise<void>;
  onPublish: (id: string) => Promise<void>;
}) {
  return (
    <section className="rounded-xl border bg-card p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {context?.published ? (
        <div className="mt-5">
          <PolicySummary policy={context.published} />
        </div>
      ) : null}
      {context?.draft ? (
        <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-950">
            Draft version {context.draft.version}
          </p>
          <div className="mt-3">
            <PolicySummary policy={context.draft} />
          </div>
          {!readOnly ? (
            <Button
              className="mt-4"
              disabled={busy}
              onClick={() => void onPublish(context.draft!.id)}
            >
              Publish this version
            </Button>
          ) : null}
        </div>
      ) : !readOnly ? (
        <PolicyForm busy={busy} onSubmit={onCreate} />
      ) : null}
      {!context?.published && !context?.draft ? (
        <p className="mt-5 text-sm text-muted-foreground">
          No policy has been configured.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function PolicyForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (input: FlexibleTicketPolicyInput) => Promise<void>;
}) {
  const [draft, setDraft] = useState(initialPolicy);
  function update<K extends keyof FlexibleTicketPolicyInput>(
    key: K,
    value: FlexibleTicketPolicyInput[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    void onSubmit(draft);
  }
  return (
    <form onSubmit={submit} className="mt-6 grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-medium">
          Fee method
          <select
            className="mt-2 h-10 w-full rounded-lg border bg-background px-3"
            value={draft.feeType}
            onChange={(event) =>
              update(
                "feeType",
                event.target.value as FlexibleTicketPolicyInput["feeType"],
              )
            }
          >
            <option value="FIXED">Fixed per Ticket</option>
            <option value="PERCENTAGE">Percentage of Ticket</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Fee value
          <input
            className="mt-2 h-10 w-full rounded-lg border px-3"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={draft.feeValue}
            onChange={(event) => update("feeValue", Number(event.target.value))}
          />
        </label>
        <label className="text-sm font-medium">
          Cut-off before Session
          <input
            className="mt-2 h-10 w-full rounded-lg border px-3"
            type="number"
            min="0"
            step="1"
            required
            value={draft.cutoffMinutesBeforeSession}
            onChange={(event) =>
              update("cutoffMinutesBeforeSession", Number(event.target.value))
            }
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            minutes
          </span>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-medium">
          Permitted uses
          <input
            className="mt-2 h-10 w-full rounded-lg border px-3"
            type="number"
            min="1"
            max="100"
            step="1"
            required
            value={draft.permittedUseLimit}
            onChange={(event) =>
              update("permittedUseLimit", Number(event.target.value))
            }
          />
        </label>
        <label className="text-sm font-medium">
          Higher-priced destination
          <select
            className="mt-2 h-10 w-full rounded-lg border bg-background px-3"
            value={draft.priceIncreaseTreatment}
            onChange={(event) =>
              update(
                "priceIncreaseTreatment",
                event.target
                  .value as FlexibleTicketPolicyInput["priceIncreaseTreatment"],
              )
            }
          >
            <option value="CUSTOMER_PAYS_DIFFERENCE">
              Customer pays difference
            </option>
            <option value="CHANGE_NOT_PERMITTED">Change not permitted</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Lower-priced destination
          <select
            className="mt-2 h-10 w-full rounded-lg border bg-background px-3"
            value={draft.priceDecreaseTreatment}
            onChange={(event) =>
              update(
                "priceDecreaseTreatment",
                event.target
                  .value as FlexibleTicketPolicyInput["priceDecreaseTreatment"],
              )
            }
          >
            <option value="KEEP_ORIGINAL_PRICE">Keep original price</option>
            <option value="REFUND_DIFFERENCE">Refund difference</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Flexible Ticket fee
          <select
            className="mt-2 h-10 w-full rounded-lg border bg-background px-3"
            value={draft.feeRefundability}
            onChange={(event) =>
              update(
                "feeRefundability",
                event.target
                  .value as FlexibleTicketPolicyInput["feeRefundability"],
              )
            }
          >
            <option value="NON_REFUNDABLE">Non-refundable</option>
            <option value="REFUNDABLE_WITH_TICKET">
              Refund with covered Ticket
            </option>
            <option value="EVENT_CANCELLATION_ONLY">
              Event cancellation only
            </option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-5 text-sm">
        <label>
          <input
            type="checkbox"
            checked={draft.available}
            onChange={(event) => update("available", event.target.checked)}
          />{" "}
          <span className="ml-2">Available for new purchases</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={draft.allowsSessionChange}
            onChange={(event) =>
              update("allowsSessionChange", event.target.checked)
            }
          />{" "}
          <span className="ml-2">Allow Session-change requests</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={draft.allowsRefundRequest}
            onChange={(event) =>
              update("allowsRefundRequest", event.target.checked)
            }
          />{" "}
          <span className="ml-2">Allow cancellation/refund requests</span>
        </label>
      </div>
      <label className="text-sm font-medium">
        Customer summary
        <textarea
          className="mt-2 min-h-20 w-full rounded-lg border p-3"
          maxLength={500}
          required
          value={draft.customerSummary}
          onChange={(event) => update("customerSummary", event.target.value)}
        />
      </label>
      <label className="text-sm font-medium">
        Material terms
        <textarea
          className="mt-2 min-h-32 w-full rounded-lg border p-3"
          maxLength={10000}
          required
          value={draft.materialTerms}
          onChange={(event) => update("materialTerms", event.target.value)}
        />
      </label>
      <Button
        type="submit"
        className="w-fit"
        disabled={
          busy || (!draft.allowsSessionChange && !draft.allowsRefundRequest)
        }
      >
        {busy ? "Creating draft…" : "Create draft for review"}
      </Button>
    </form>
  );
}

function PolicySummary({
  policy,
  empty = "No published policy.",
}: {
  policy: FlexibleTicketPolicy | null;
  empty?: string;
}) {
  if (!policy) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const fee =
    policy.feeType === "FIXED"
      ? new Intl.NumberFormat("en-AU", {
          style: "currency",
          currency: policy.currency,
        }).format(policy.feeValue)
      : `${policy.feeValue}%`;
  return (
    <div className="rounded-lg border bg-muted/30 p-4 text-sm">
      <div className="flex flex-wrap justify-between gap-2">
        <p className="font-semibold">
          Version {policy.version} · {policy.status}
        </p>
        <p className="font-semibold">{fee} per covered Ticket</p>
      </div>
      <p className="mt-2">{policy.customerSummary}</p>
      <p className="mt-2 text-muted-foreground">
        Cut-off: {policy.cutoffMinutesBeforeSession} minutes before Session ·{" "}
        {policy.permittedUseLimit} permitted use
      </p>
    </div>
  );
}
