"use client";

import { CheckCircle2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";

import {
  PublicWaiver,
  WaiverBookingContext,
  WaiverMinorInput,
  WaiverSubmissionResponse,
  publicWaiverService,
} from "@/services/public-waiver.service";
import {
  defaultEventBranding,
  eventFontFamilies,
} from "@/components/booking/event-branding";
import { publicBookingService } from "@/services/public-booking.service";
import { buildWaiverReturnAction } from "./waiver-return";

interface PublicWaiverPageProps {
  params: Promise<{
    publicSlug: string;
  }>;
}

interface SignaturePadProps {
  onChange: (signatureData: string | null) => void;
}

function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    const bounds = canvas.getBoundingClientRect();
    canvas.width = bounds.width * ratio;
    canvas.height = bounds.height * ratio;
    context.scale(ratio, ratio);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2.25;
    context.strokeStyle = "#172033";
  }, []);

  function pointForEvent(event: React.PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();

    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = canvasRef.current?.getContext("2d");

    if (!context) {
      return;
    }

    const point = pointForEvent(event);
    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) {
      return;
    }

    const context = canvasRef.current?.getContext("2d");

    if (!context) {
      return;
    }

    const point = pointForEvent(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    setHasSignature(true);
  }

  function finishDrawing() {
    if (!drawingRef.current) {
      return;
    }

    drawingRef.current = false;
    const canvas = canvasRef.current;

    if (canvas) {
      onChange(canvas.toDataURL("image/png"));
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange(null);
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          aria-label="Draw your signature"
          className="h-44 w-full touch-none cursor-crosshair"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={finishDrawing}
          onPointerCancel={finishDrawing}
        />
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2">
          <span className="text-xs text-slate-500">
            Sign above using your finger or pointer
          </span>
          <button
            type="button"
            disabled={!hasSignature}
            onClick={clearSignature}
            className="text-sm font-semibold text-slate-700 disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

function formatEventDates(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `${formatter.format(new Date(startDate))} — ${formatter.format(
    new Date(endDate),
  )}`;
}

export default function PublicWaiverPage({ params }: PublicWaiverPageProps) {
  const { publicSlug } = use(params);
  const [waiver, setWaiver] = useState<PublicWaiver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [signatoryFullName, setSignatoryFullName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatoryParticipating, setSignatoryParticipating] = useState(true);
  const [signatoryParticipantId, setSignatoryParticipantId] = useState("");
  const [mediaConsent, setMediaConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [minors, setMinors] = useState<WaiverMinorInput[]>([]);
  const [bookingContext, setBookingContext] =
    useState<WaiverBookingContext | null>(null);
  const [bookingCredential, setBookingCredential] = useState<{
    bookingId: string;
    publicAccessToken: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [completion, setCompletion] = useState<WaiverSubmissionResponse | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadWaiver() {
      try {
        const result =
          await publicWaiverService.findPublishedWaiver(publicSlug);

        if (isMounted) {
          setWaiver(result);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load this waiver.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadWaiver();

    return () => {
      isMounted = false;
    };
  }, [publicSlug]);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const bookingId = fragment.get("booking");
    const publicAccessToken = fragment.get("access");
    if (!bookingId || !publicAccessToken) return;

    setBookingCredential({ bookingId, publicAccessToken });
    publicWaiverService
      .bookingContext(publicSlug, bookingId, publicAccessToken)
      .then((context) => setBookingContext(context))
      .catch((error: unknown) => {
        setSubmissionError(
          error instanceof Error
            ? error.message
            : "Unable to connect this waiver to the Booking.",
        );
      });
  }, [publicSlug]);

  function addMinor() {
    if (minors.length >= 20) {
      return;
    }

    setMinors((current) => [...current, { fullName: "", dateOfBirth: "" }]);
  }

  function updateMinor(
    index: number,
    field: keyof WaiverMinorInput,
    value: string,
  ) {
    setMinors((current) =>
      current.map((minor, minorIndex) =>
        minorIndex === index ? { ...minor, [field]: value } : minor,
      ),
    );
  }

  function removeMinor(index: number) {
    setMinors((current) =>
      current.filter((_, minorIndex) => minorIndex !== index),
    );
  }

  async function submitWaiver(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionError(null);

    if (!accepted) {
      setSubmissionError("Please confirm that you accept the waiver.");
      return;
    }

    if (!signatureData) {
      setSubmissionError("Please draw your signature before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await publicWaiverService.submit(publicSlug, {
        signatoryFullName,
        accepted: true,
        signatureData,
        signatoryParticipating,
        mediaConsent,
        marketingConsent,
        bookingId: bookingCredential?.bookingId,
        publicAccessToken: bookingCredential?.publicAccessToken,
        signatoryParticipantId:
          bookingContext && signatoryParticipating
            ? signatoryParticipantId
            : undefined,
        minors,
      });
      setCompletion(result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Unable to submit your waiver. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            Loading Event waiver…
          </p>
        </div>
      </main>
    );
  }

  if (loadError || !waiver) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto size-10 text-slate-400" />
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">
            Waiver unavailable
          </h1>
          <p className="mt-2 text-slate-600">
            {loadError ?? "This Event does not have a published waiver."}
          </p>
        </div>
      </main>
    );
  }

  if (completion) {
    const branding = waiver.event.branding ?? defaultEventBranding;
    const returnAction = buildWaiverReturnAction(
      waiver.event.slug,
      bookingCredential,
    );
    return (
      <main
        className="min-h-screen px-4 py-12 sm:py-20"
        style={{
          backgroundColor: branding.backgroundColor,
          color: branding.textColor,
          fontFamily: eventFontFamilies[branding.bodyFont],
        }}
      >
        <section
          className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 p-6 shadow-xl shadow-slate-200/60 sm:p-10"
          style={{ backgroundColor: branding.surfaceColor }}
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="size-8 text-emerald-700" />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
            Waiver complete
          </p>
          <h1
            className="mt-2 text-3xl font-semibold tracking-tight"
            style={{ fontFamily: eventFontFamilies[branding.headingFont] }}
          >
            You&apos;re ready for {waiver.event.name}
          </h1>
          <p className="mt-4 leading-7 text-slate-600">
            Your acceptance was recorded on{" "}
            {new Date(completion.acceptedAt).toLocaleString("en-AU")}. Keep the
            verification credential below as your completion proof.
          </p>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verification credential
            </p>
            <p className="mt-2 break-all font-mono text-sm leading-6 text-slate-900">
              {completion.verificationToken}
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={returnAction.href}
              className="inline-flex min-h-12 items-center justify-center rounded-xl px-5 font-bold shadow-lg"
              style={{
                backgroundColor: branding.accentColor,
                color: branding.textColor,
              }}
            >
              {returnAction.label}
            </Link>
            <Link
              href={`/waivers/verify/${completion.verificationToken}`}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 font-bold"
            >
              Open completion proof
            </Link>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-500">
            This credential contains no personal information. Glacier retains
            the authoritative waiver record.
          </p>
        </section>
      </main>
    );
  }

  const branding = waiver.event.branding ?? defaultEventBranding;
  const logoUrl = branding.logoAsset
    ? publicBookingService.brandingAssetUrl(
        waiver.event.slug,
        branding.logoAsset.id,
      )
    : null;
  const heroUrl = branding.heroAsset
    ? publicBookingService.brandingAssetUrl(
        waiver.event.slug,
        branding.heroAsset.id,
      )
    : null;

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: branding.backgroundColor,
        color: branding.textColor,
        fontFamily: eventFontFamilies[branding.bodyFont],
      }}
    >
      <header className="border-b px-4 py-5">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // Public URL exposes only the Event's selected branding asset.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={`${waiver.event.name} logo`}
                className="max-h-14 max-w-40 object-contain"
              />
            ) : (
              <div
                className="flex size-10 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: branding.primaryColor }}
              >
                <ShieldCheck className="size-5" />
              </div>
            )}
            <div>
              <p className="font-semibold tracking-tight">
                {waiver.event.name}
              </p>
              <p className="text-xs opacity-60">Secure digital Waiver</p>
            </div>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] opacity-50">
            Powered by Glacier
          </span>
        </div>
      </header>

      <section
        className="relative overflow-hidden"
        style={{
          backgroundColor: branding.primaryColor,
          color: branding.backgroundColor,
        }}
      >
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-30"
          />
        ) : null}
        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <p className="text-sm font-bold uppercase tracking-[0.18em] opacity-75">
            Event waiver
          </p>
          <h1
            className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl"
            style={{ fontFamily: eventFontFamilies[branding.headingFont] }}
          >
            {waiver.waiver.title}
          </h1>
          <div className="mt-6 grid gap-2 text-sm opacity-85 sm:grid-cols-2">
            <p className="font-semibold">{waiver.event.name}</p>
            <p className="sm:text-right">
              {waiver.event.venueName ?? "Venue to be confirmed"}
            </p>
            <p className="sm:col-span-2">
              {formatEventDates(waiver.event.startDate, waiver.event.endDate)}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <section
          className="rounded-3xl border border-slate-200 p-6 shadow-sm sm:p-10"
          style={{ backgroundColor: branding.surfaceColor }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: branding.accentColor }}
            >
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="font-semibold">Before you begin</p>
              <p className="text-sm opacity-65">
                Please read the complete Waiver and provide your acceptance
                below.
              </p>
            </div>
          </div>
        </section>

        <section
          className="mt-6 rounded-3xl border border-slate-200 p-6 shadow-sm sm:p-10"
          style={{ backgroundColor: branding.surfaceColor }}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Please read carefully</h2>
            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Version {waiver.waiver.version}
            </span>
          </div>
          <div className="mt-6 whitespace-pre-wrap text-[0.95rem] leading-7 text-slate-700">
            {waiver.waiver.content}
          </div>
        </section>

        <form onSubmit={submitWaiver} className="mt-6 space-y-6">
          <section
            className="rounded-3xl border border-slate-200 p-6 shadow-sm sm:p-10"
            style={{ backgroundColor: branding.surfaceColor }}
          >
            <h2 className="text-xl font-semibold">Your acceptance</h2>
            <label className="mt-6 block text-sm font-semibold text-slate-800">
              Full legal name
              <input
                required
                maxLength={200}
                autoComplete="name"
                value={signatoryFullName}
                onChange={(event) => setSignatoryFullName(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-sky-700 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={signatoryParticipating}
                onChange={(event) => {
                  setSignatoryParticipating(event.target.checked);
                  if (!event.target.checked) setSignatoryParticipantId("");
                }}
                className="mt-1 size-5 accent-sky-800"
              />
              <span className="text-sm leading-6 text-slate-700">
                I am also participating in this Event activity.
              </span>
            </label>

            {bookingContext && signatoryParticipating ? (
              <label className="mt-5 block text-sm font-semibold text-slate-800">
                Match yourself to this Booking
                <select
                  required
                  value={signatoryParticipantId}
                  onChange={(event) =>
                    setSignatoryParticipantId(event.target.value)
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base"
                >
                  <option value="">Choose a participant</option>
                  {bookingContext.participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.firstName} {participant.lastName} ·{" "}
                      {participant.ticketType.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-1 size-5 rounded border-slate-400 accent-sky-800"
              />
              <span className="text-sm leading-6 text-slate-700">
                {waiver.waiver.acceptanceStatement}
              </span>
            </label>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-800">
                Electronic signature
              </p>
              <div className="mt-2">
                <SignaturePad onChange={setSignatureData} />
              </div>
            </div>
          </section>

          <section
            className="rounded-3xl border border-slate-200 p-6 shadow-sm sm:p-10"
            style={{ backgroundColor: branding.surfaceColor }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Children in your care</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Optional. Add each minor covered by your acceptance.
                </p>
              </div>
              <button
                type="button"
                onClick={addMinor}
                disabled={minors.length >= 20}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-40"
              >
                <Plus className="size-4" />
                Add
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {minors.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No minors added.
                </p>
              ) : null}

              {minors.map((minor, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Minor {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeMinor(index)}
                      aria-label={`Remove minor ${index + 1}`}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Full name
                      <input
                        required
                        maxLength={200}
                        value={minor.fullName}
                        onChange={(event) =>
                          updateMinor(index, "fullName", event.target.value)
                        }
                        className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-sky-700 focus:ring-4 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Date of birth
                      <input
                        required
                        type="date"
                        max={new Date().toISOString().slice(0, 10)}
                        value={minor.dateOfBirth}
                        onChange={(event) =>
                          updateMinor(index, "dateOfBirth", event.target.value)
                        }
                        className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-sky-700 focus:ring-4 focus:ring-sky-100"
                      />
                    </label>
                    {bookingContext ? (
                      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                        Match this child to the Booking
                        <select
                          required
                          value={minor.bookingParticipantId ?? ""}
                          onChange={(event) =>
                            setMinors((current) =>
                              current.map((item, minorIndex) =>
                                minorIndex === index
                                  ? {
                                      ...item,
                                      bookingParticipantId: event.target.value,
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base"
                        >
                          <option value="">Choose a participant</option>
                          {bookingContext.participants.map((participant) => (
                            <option key={participant.id} value={participant.id}>
                              {participant.firstName} {participant.lastName} ·{" "}
                              {participant.ticketType.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            className="rounded-3xl border border-slate-200 p-6 shadow-sm sm:p-10"
            style={{ backgroundColor: branding.surfaceColor }}
          >
            <h2 className="text-xl font-semibold">Optional permissions</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              These choices are separate from the mandatory activity waiver.
              Declining them does not prevent participation.
            </p>
            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={mediaConsent}
                onChange={(event) => setMediaConsent(event.target.checked)}
                className="mt-1 size-5 accent-sky-800"
              />
              <span className="text-sm leading-6 text-slate-700">
                I consent to approved Event photography or video use.
              </span>
            </label>
            <label className="mt-3 flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(event) => setMarketingConsent(event.target.checked)}
                className="mt-1 size-5 accent-sky-800"
              />
              <span className="text-sm leading-6 text-slate-700">
                I would like to receive optional Event updates and marketing.
              </span>
            </label>
          </section>

          {submissionError ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              {submissionError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-14 w-full rounded-2xl px-6 text-base font-bold shadow-lg transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              backgroundColor: branding.accentColor,
              color: branding.textColor,
            }}
          >
            {isSubmitting ? "Submitting securely…" : "Accept and sign waiver"}
          </button>
          <p className="pb-10 text-center text-xs leading-5 text-slate-500">
            Your acceptance time, published waiver version, signature, and
            integrity evidence are recorded securely by Glacier.
          </p>
        </form>
      </div>
    </main>
  );
}
