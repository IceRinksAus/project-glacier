"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  EventSiteContentInput,
  EventSiteContentVersion,
  eventService,
} from "@/services/event.service";

const emptyContent: EventSiteContentInput = {
  aboutTitle: "",
  aboutBody: "",
  arrivalInfo: "",
  transportParkingInfo: "",
  accessibilityInfo: "",
  foodDrinkInfo: "",
  whatToBringInfo: "",
  highlights: [],
  faqs: [],
};

const commonFaqTemplates = [
  "How early should I arrive?",
  "Is skate hire included with my ticket?",
  "What clothing should I wear?",
  "Is the Event suitable for beginners and children?",
  "How long is each session?",
  "Where can I park or find public transport?",
  "What accessibility support is available?",
  "Can I purchase food and drinks at the Event?",
  "Do I need to complete a Waiver before attending?",
  "Can I change or cancel my booking?",
] as const;

function editableContent(
  content: EventSiteContentVersion | null,
): EventSiteContentInput {
  if (!content) return emptyContent;
  return {
    aboutTitle: content.aboutTitle ?? "",
    aboutBody: content.aboutBody ?? "",
    arrivalInfo: content.arrivalInfo ?? "",
    transportParkingInfo: content.transportParkingInfo ?? "",
    accessibilityInfo: content.accessibilityInfo ?? "",
    foodDrinkInfo: content.foodDrinkInfo ?? "",
    whatToBringInfo: content.whatToBringInfo ?? "",
    highlights: content.highlights.map((item) => ({ ...item })),
    faqs: content.faqs.map((item) => ({ ...item })),
  };
}

export function EventSiteContentWorkspace({
  eventId,
  eventName,
  canEdit,
}: {
  eventId: string;
  eventName: string;
  canEdit: boolean;
}) {
  const [content, setContent] = useState<EventSiteContentInput>(emptyContent);
  const [draftVersion, setDraftVersion] = useState<number | null>(null);
  const [publishedVersion, setPublishedVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void eventService
      .getSiteContent(eventId)
      .then((workspace) => {
        if (!active) return;
        const source = workspace.draft ?? workspace.published;
        setContent(editableContent(source));
        setDraftVersion(workspace.draft?.version ?? null);
        setPublishedVersion(workspace.published?.version ?? null);
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load homepage content.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  const hasContent = useMemo(
    () =>
      Boolean(
        content.aboutBody?.trim() ||
          content.arrivalInfo?.trim() ||
          content.transportParkingInfo?.trim() ||
          content.accessibilityInfo?.trim() ||
          content.foodDrinkInfo?.trim() ||
          content.whatToBringInfo?.trim() ||
          content.highlights.length ||
          content.faqs.length,
      ),
    [content],
  );

  function updateText(
    key: Exclude<keyof EventSiteContentInput, "highlights" | "faqs">,
    value: string,
  ) {
    setContent((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  async function saveDraft() {
    const incompleteHighlight = content.highlights.some(
      (item) => !item.title.trim() || !item.description.trim(),
    );
    const incompleteFaq = content.faqs.some(
      (item) => !item.question.trim() || !item.answer.trim(),
    );
    if (incompleteHighlight || incompleteFaq) {
      setError(
        "Complete every Highlight title and description and every FAQ question and answer before saving.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const saved = await eventService.saveSiteContentDraft(eventId, content);
      setDraftVersion(saved.version);
      setMessage("Homepage draft saved. The live website has not changed.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save the draft.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const published = await eventService.publishSiteContent(eventId);
      setPublishedVersion(published.version);
      setDraftVersion(null);
      setMessage(`Homepage version ${published.version} is now live.`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to publish the homepage.",
      );
    } finally {
      setBusy(false);
    }
  }

  function addHighlight() {
    if (content.highlights.length >= 8) return;
    setContent((current) => ({
      ...current,
      highlights: [
        ...current.highlights,
        { title: "", description: "" },
      ],
    }));
  }

  function addFaq() {
    if (content.faqs.length >= 12) return;
    setContent((current) => ({
      ...current,
      faqs: [...current.faqs, { question: "", answer: "" }],
    }));
  }

  function addFaqTemplate(question: string) {
    if (
      content.faqs.length >= 12 ||
      content.faqs.some(
        (item) => item.question.trim().toLowerCase() === question.toLowerCase(),
      )
    ) {
      return;
    }
    setContent((current) => ({
      ...current,
      faqs: [...current.faqs, { question, answer: "" }],
    }));
    setMessage("");
    setError("");
  }

  function moveItem(type: "highlights" | "faqs", index: number, delta: number) {
    setContent((current) => {
      const items = [...current[type]];
      const destination = index + delta;
      if (destination < 0 || destination >= items.length) return current;
      [items[index], items[destination]] = [items[destination], items[index]];
      return { ...current, [type]: items };
    });
  }

  if (loading) {
    return <section className="rounded-xl border bg-card p-6">Loading homepage content…</section>;
  }

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Homepage content
          </p>
          <h2 className="mt-2 text-xl font-semibold">Tell customers about {eventName}</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Save work privately, review the preview below, then publish the complete version deliberately.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full border px-3 py-1.5">
            Draft {draftVersion ?? "not saved"}
          </span>
          <span className="rounded-full border px-3 py-1.5">
            Live {publishedVersion ?? "minimal page"}
          </span>
        </div>
      </div>

      {!canEdit ? (
        <p className="mt-4 rounded-lg bg-muted p-3 text-sm">
          This content is read-only. Existing Website permissions are unchanged.
        </p>
      ) : null}

      <fieldset disabled={!canEdit || busy} className="mt-6 space-y-7">
        <ContentSection title="About the Event">
          <TextField label="About heading" maxLength={100} value={content.aboutTitle ?? ""} onChange={(value) => updateText("aboutTitle", value)} />
          <TextArea label="About description" maxLength={3000} value={content.aboutBody ?? ""} onChange={(value) => updateText("aboutBody", value)} />
        </ContentSection>

        <ContentSection title="Experience highlights">
          {content.highlights.map((item, index) => (
            <div key={index} className="rounded-xl border p-4">
              <TextField label={`Highlight ${index + 1} title`} maxLength={80} value={item.title} onChange={(value) => setContent((current) => ({ ...current, highlights: current.highlights.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: value } : entry) }))} />
              <div className="mt-3"><TextArea label={`Highlight ${index + 1} description`} maxLength={300} value={item.description} onChange={(value) => setContent((current) => ({ ...current, highlights: current.highlights.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: value } : entry) }))} /></div>
              <ItemActions index={index} count={content.highlights.length} onMove={(delta) => moveItem("highlights", index, delta)} onRemove={() => setContent((current) => ({ ...current, highlights: current.highlights.filter((_, itemIndex) => itemIndex !== index) }))} />
            </div>
          ))}
          <Button type="button" variant="outline" disabled={content.highlights.length >= 8} onClick={addHighlight}>Add highlight</Button>
        </ContentSection>

        <ContentSection title="Plan your visit">
          <div className="grid gap-4 lg:grid-cols-2">
            <TextArea label="Arrival information" maxLength={1500} value={content.arrivalInfo ?? ""} onChange={(value) => updateText("arrivalInfo", value)} />
            <TextArea label="Transport and parking" maxLength={1500} value={content.transportParkingInfo ?? ""} onChange={(value) => updateText("transportParkingInfo", value)} />
            <TextArea label="Accessibility" maxLength={1500} value={content.accessibilityInfo ?? ""} onChange={(value) => updateText("accessibilityInfo", value)} />
            <TextArea label="Food and drink" maxLength={1500} value={content.foodDrinkInfo ?? ""} onChange={(value) => updateText("foodDrinkInfo", value)} />
            <TextArea label="What to bring" maxLength={1500} value={content.whatToBringInfo ?? ""} onChange={(value) => updateText("whatToBringInfo", value)} />
          </div>
        </ContentSection>

        <ContentSection title="Frequently asked questions">
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm font-semibold">Common FAQ templates</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add a common customer question, then write the answer that is accurate for this Event.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {commonFaqTemplates.map((question) => {
                const alreadyAdded = content.faqs.some(
                  (item) =>
                    item.question.trim().toLowerCase() === question.toLowerCase(),
                );
                return (
                  <Button
                    key={question}
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={alreadyAdded || content.faqs.length >= 12}
                    onClick={() => addFaqTemplate(question)}
                  >
                    {alreadyAdded ? "Added · " : "Add · "}{question}
                  </Button>
                );
              })}
            </div>
          </div>
          {content.faqs.map((item, index) => (
            <div key={index} className="rounded-xl border p-4">
              <TextField label={`FAQ ${index + 1} question`} maxLength={160} value={item.question} onChange={(value) => setContent((current) => ({ ...current, faqs: current.faqs.map((entry, itemIndex) => itemIndex === index ? { ...entry, question: value } : entry) }))} />
              <div className="mt-3"><TextArea label={`FAQ ${index + 1} answer`} maxLength={800} value={item.answer} onChange={(value) => setContent((current) => ({ ...current, faqs: current.faqs.map((entry, itemIndex) => itemIndex === index ? { ...entry, answer: value } : entry) }))} /></div>
              <ItemActions index={index} count={content.faqs.length} onMove={(delta) => moveItem("faqs", index, delta)} onRemove={() => setContent((current) => ({ ...current, faqs: current.faqs.filter((_, itemIndex) => itemIndex !== index) }))} />
            </div>
          ))}
          <Button type="button" variant="outline" disabled={content.faqs.length >= 12} onClick={addFaq}>Add FAQ</Button>
        </ContentSection>

        {canEdit ? (
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => void saveDraft()} disabled={busy}>{busy ? "Working…" : "Save draft"}</Button>
            <Button type="button" onClick={() => void publish()} disabled={busy || draftVersion === null || !hasContent}>Publish homepage</Button>
          </div>
        ) : null}
      </fieldset>

      {message ? <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      <div id="homepage-content-preview" className="mt-8 scroll-mt-6 rounded-2xl border bg-muted/30 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Authenticated draft preview</p>
        <h3 className="mt-3 text-2xl font-semibold">{content.aboutTitle?.trim() || `About ${eventName}`}</h3>
        {content.aboutBody ? <p className="mt-3 whitespace-pre-line text-sm leading-7">{content.aboutBody}</p> : <p className="mt-3 text-sm text-muted-foreground">Add About content to introduce this Event.</p>}
        {content.highlights.length ? <div className="mt-5 grid gap-3 md:grid-cols-3">{content.highlights.map((item, index) => <div key={index} className="rounded-xl border bg-background p-4"><strong>{item.title || `Highlight ${index + 1}`}</strong><p className="mt-2 text-sm">{item.description || "Description preview"}</p></div>)}</div> : null}
        {content.faqs.length ? <div className="mt-6 space-y-2"><h4 className="font-semibold">Frequently asked questions</h4>{content.faqs.map((item, index) => <details key={index} className="rounded-lg border bg-background p-3"><summary className="font-medium">{item.question || `Question ${index + 1}`}</summary><p className="mt-2 whitespace-pre-line text-sm">{item.answer || "Answer preview"}</p></details>)}</div> : null}
      </div>
    </section>
  );
}

function ContentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className="text-base font-semibold">{title}</h3><div className="mt-3 space-y-3">{children}</div></div>;
}

function TextField({ label, value, maxLength, onChange }: { label: string; value: string; maxLength: number; onChange: (value: string) => void }) {
  return <label className="block text-sm font-medium">{label}<input value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm" /></label>;
}

function TextArea({ label, value, maxLength, onChange }: { label: string; value: string; maxLength: number; onChange: (value: string) => void }) {
  return <label className="block text-sm font-medium">{label}<textarea value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-28 w-full rounded-lg border bg-background p-3 text-sm" /></label>;
}

function ItemActions({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (delta: number) => void; onRemove: () => void }) {
  return <div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => onMove(-1)}>Move up</Button><Button type="button" size="sm" variant="outline" disabled={index === count - 1} onClick={() => onMove(1)}>Move down</Button><Button type="button" size="sm" variant="outline" onClick={onRemove}>Remove</Button></div>;
}
