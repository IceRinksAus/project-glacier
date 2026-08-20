"use client";

import { CheckCircle2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { use, useEffect, useRef, useState } from "react";

import {
  PublicWaiver,
  WaiverMinorInput,
  WaiverSubmissionResponse,
  publicWaiverService,
} from "@/services/public-waiver.service";

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
  const [minors, setMinors] = useState<WaiverMinorInput[]>([]);
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
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#e9f7ff_0%,#f8fafc_45%)] px-4 py-12 sm:py-20">
        <section className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-10">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="size-8 text-emerald-700" />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
            Waiver complete
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
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
          <p className="mt-5 text-sm leading-6 text-slate-500">
            This credential contains no personal information. Glacier retains
            the authoritative waiver record.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#e9f7ff_0%,#f8fafc_28rem)] text-slate-950">
      <header className="border-b border-sky-200/70 bg-white/75 px-4 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-sky-950 text-white">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="font-semibold tracking-tight">Glacier Waivers</p>
            <p className="text-xs text-slate-500">Secure digital acceptance</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <section className="rounded-3xl border border-sky-200 bg-white p-6 shadow-xl shadow-sky-950/5 sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
            Event waiver
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {waiver.waiver.title}
          </h1>
          <div className="mt-5 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <p className="font-medium text-slate-800">{waiver.event.name}</p>
            <p className="sm:text-right">
              {waiver.event.venueName ?? "Venue to be confirmed"}
            </p>
            <p className="sm:col-span-2">
              {formatEventDates(waiver.event.startDate, waiver.event.endDate)}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
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
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
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

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
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
                  </div>
                </div>
              ))}
            </div>
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
            className="h-14 w-full rounded-2xl bg-sky-950 px-6 text-base font-bold text-white shadow-lg shadow-sky-950/15 transition hover:bg-sky-900 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
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
