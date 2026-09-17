"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { Button } from "@/components/ui/button";
import { CatalogueImage } from "@/components/catalogue/CatalogueImage";
import {
  getAuthRoleSnapshot,
  getServerAuthRoleSnapshot,
  subscribeAuthSession,
} from "@/lib/auth";
import { TicketType, ticketTypeService } from "@/services/ticket-type.service";

interface TicketTypesWorkspaceProps {
  eventId: string;
  onReturnToReadiness: () => void;
}

function formatPrice(price: string | number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(price));
}

function TicketTypePresentationEditor({
  ticketType,
  disabled,
  onSave,
  onUpload,
  onRemoveImage,
}: {
  ticketType: TicketType;
  disabled: boolean;
  onSave: (label: string, color: string) => Promise<void>;
  onUpload: (file?: File) => Promise<void>;
  onRemoveImage: () => Promise<void>;
}) {
  const [label, setLabel] = useState(ticketType.tileLabel ?? "");
  const [color, setColor] = useState(ticketType.tileColor || "#0B6CE3");
  return (
    <details className="mt-4 border-t pt-3 text-sm">
      <summary className="cursor-pointer font-medium">
        Manage appearance
      </summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_90px]">
        <label>
          Tile label
          <input
            value={label}
            maxLength={24}
            onChange={(event) => setLabel(event.target.value)}
            className="mt-1 h-9 w-full rounded-lg border px-3"
          />
        </label>
        <label>
          Colour
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value.toUpperCase())}
            className="mt-1 h-9 w-full rounded-lg border p-1"
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={disabled}
          onClick={() => void onSave(label, color)}
        >
          Save appearance
        </Button>
        <label className="cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium">
          {ticketType.imageAsset ? "Replace image" : "Add image"}
          <input
            type="file"
            accept="image/png,image/jpeg"
            className="sr-only"
            disabled={disabled}
            onChange={(event) => void onUpload(event.target.files?.[0])}
          />
        </label>
        {ticketType.imageAsset ? (
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => void onRemoveImage()}
          >
            Remove image
          </Button>
        ) : null}
      </div>
    </details>
  );
}

function TicketTypeAgePolicyEditor({
  ticketType,
  disabled,
  onSave,
}: {
  ticketType: TicketType;
  disabled: boolean;
  onSave: (
    minimumAge: number | null,
    maximumAge: number | null,
  ) => Promise<void>;
}) {
  const [minimumAge, setMinimumAge] = useState(
    ticketType.minimumAge?.toString() ?? "",
  );
  const [maximumAge, setMaximumAge] = useState(
    ticketType.maximumAge?.toString() ?? "",
  );
  return (
    <details className="mt-4 border-t pt-3 text-sm">
      <summary className="cursor-pointer font-medium">Manage age range</summary>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        POS uses a valid age from this range for walk-up Rules. Staff can still
        correct it when the actual age matters.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label>
          Minimum age
          <input
            aria-label={`${ticketType.name} minimum age`}
            type="number"
            min="0"
            max="130"
            value={minimumAge}
            onChange={(event) => setMinimumAge(event.target.value)}
            className="mt-1 h-9 w-full rounded-lg border px-3"
          />
        </label>
        <label>
          Maximum age
          <input
            aria-label={`${ticketType.name} maximum age`}
            type="number"
            min="0"
            max="130"
            value={maximumAge}
            onChange={(event) => setMaximumAge(event.target.value)}
            className="mt-1 h-9 w-full rounded-lg border px-3"
          />
        </label>
      </div>
      <Button
        type="button"
        size="sm"
        className="mt-3"
        disabled={disabled}
        onClick={() =>
          void onSave(
            minimumAge === "" ? null : Number(minimumAge),
            maximumAge === "" ? null : Number(maximumAge),
          )
        }
      >
        Save age range
      </Button>
    </details>
  );
}

export function TicketTypesWorkspace({
  eventId,
  onReturnToReadiness,
}: TicketTypesWorkspaceProps) {
  const role = useSyncExternalStore(
    subscribeAuthSession,
    getAuthRoleSnapshot,
    getServerAuthRoleSnapshot,
  );
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tileLabel, setTileLabel] = useState("");
  const [tileColor, setTileColor] = useState("#0B6CE3");
  const [minimumAge, setMinimumAge] = useState("");
  const [maximumAge, setMaximumAge] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [busyTicketTypeId, setBusyTicketTypeId] = useState("");

  const loadTicketTypes = useCallback(async () => {
    try {
      const result = await ticketTypeService.findForEvent(eventId);
      setTicketTypes(result);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load Ticket Types.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    ticketTypeService
      .findForEvent(eventId)
      .then((result) => {
        setTicketTypes(result);
        setError("");
      })
      .catch((loadError) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load Ticket Types.",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [eventId]);

  async function createTicketType(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const parsedPrice = Number(price);
    const parsedMinimumAge = minimumAge === "" ? undefined : Number(minimumAge);
    const parsedMaximumAge = maximumAge === "" ? undefined : Number(maximumAge);

    if (
      !cleanName ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0 ||
      (parsedMinimumAge != null &&
        parsedMaximumAge != null &&
        parsedMinimumAge > parsedMaximumAge)
    ) {
      setError("Enter a name, non-negative price and a valid age range.");
      setSavedMessage("");
      return;
    }

    setIsSaving(true);
    setError("");
    setSavedMessage("");

    try {
      const ticketType = await ticketTypeService.create({
        eventId,
        name: cleanName,
        ...(description.trim() ? { description: description.trim() } : {}),
        price: parsedPrice,
        active: true,
        ...(tileLabel.trim() ? { tileLabel: tileLabel.trim() } : {}),
        tileColor,
        ...(parsedMinimumAge != null ? { minimumAge: parsedMinimumAge } : {}),
        ...(parsedMaximumAge != null ? { maximumAge: parsedMaximumAge } : {}),
      });
      if (image) await ticketTypeService.uploadImage(ticketType.id, image);
      setName("");
      setDescription("");
      setPrice("");
      setTileLabel("");
      setTileColor("#0B6CE3");
      setMinimumAge("");
      setMaximumAge("");
      setImage(null);
      setSavedMessage(
        "Active Ticket Type created. Event readiness will update automatically.",
      );
      await loadTicketTypes();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create the Ticket Type.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function updatePresentation(
    ticketType: TicketType,
    label: string,
    color: string,
  ) {
    setBusyTicketTypeId(ticketType.id);
    setError("");
    try {
      await ticketTypeService.updatePresentation(ticketType.id, {
        ...(label.trim() ? { tileLabel: label.trim() } : {}),
        tileColor: color,
      });
      await loadTicketTypes();
      setSavedMessage(`${ticketType.name} appearance updated.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to update appearance.",
      );
    } finally {
      setBusyTicketTypeId("");
    }
  }

  async function updateAgePolicy(
    ticketType: TicketType,
    nextMinimumAge: number | null,
    nextMaximumAge: number | null,
  ) {
    if (
      nextMinimumAge != null &&
      nextMaximumAge != null &&
      nextMinimumAge > nextMaximumAge
    ) {
      setError("Minimum age must not be greater than maximum age.");
      return;
    }
    setBusyTicketTypeId(ticketType.id);
    setError("");
    try {
      await ticketTypeService.updateAgePolicy(ticketType.id, {
        minimumAge: nextMinimumAge,
        maximumAge: nextMaximumAge,
      });
      await loadTicketTypes();
      setSavedMessage(`${ticketType.name} age range updated.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to update age range.",
      );
    } finally {
      setBusyTicketTypeId("");
    }
  }

  async function replaceImage(ticketType: TicketType, file?: File) {
    if (!file) return;
    setBusyTicketTypeId(ticketType.id);
    try {
      await ticketTypeService.uploadImage(ticketType.id, file);
      await loadTicketTypes();
      setSavedMessage(`${ticketType.name} image updated.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to update image.",
      );
    } finally {
      setBusyTicketTypeId("");
    }
  }

  async function removeImage(ticketType: TicketType) {
    setBusyTicketTypeId(ticketType.id);
    try {
      await ticketTypeService.removeImage(ticketType.id);
      await loadTicketTypes();
      setSavedMessage(`${ticketType.name} image removed.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to remove image.",
      );
    } finally {
      setBusyTicketTypeId("");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-xl border bg-card p-6">
        <p className="text-sm font-medium text-muted-foreground">
          Admission catalogue
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Ticket Types
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Ticket Types define the admission options customers can book for this
          Event. The Session capacity remains the shared rink limit across every
          Ticket Type combination.
        </p>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Loading Ticket Types...
          </p>
        ) : ticketTypes.length ? (
          <div className="mt-6 space-y-3">
            {ticketTypes.map((ticketType) => (
              <article
                key={ticketType.id}
                className="overflow-hidden rounded-xl border"
              >
                <div
                  className="flex h-28 items-center justify-center overflow-hidden"
                  style={{ backgroundColor: ticketType.tileColor || "#0B6CE3" }}
                >
                  {ticketType.imageAsset ? (
                    <CatalogueImage
                      path={`/ticket-type/${ticketType.id}/image/${ticketType.imageAsset.id}`}
                      alt={ticketType.imageAsset.displayName}
                      fallbackLabel={ticketType.tileLabel || ticketType.name}
                    />
                  ) : (
                    <span className="px-4 text-center text-2xl font-bold tracking-wide text-white">
                      {ticketType.tileLabel || ticketType.name}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{ticketType.name}</h3>
                      {ticketType.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {ticketType.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      {ticketType.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <dl className="mt-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Price</dt>
                      <dd className="mt-1 font-semibold">
                        {formatPrice(ticketType.price)}
                      </dd>
                    </div>
                    <div className="mt-3">
                      <dt className="text-muted-foreground">Age range</dt>
                      <dd className="mt-1 font-semibold">
                        {ticketType.minimumAge == null &&
                        ticketType.maximumAge == null
                          ? "Not configured"
                          : `${ticketType.minimumAge ?? 0}–${ticketType.maximumAge ?? "No maximum"}`}
                      </dd>
                    </div>
                  </dl>
                  {role === "OWNER" ? (
                    <>
                      <TicketTypePresentationEditor
                        ticketType={ticketType}
                        disabled={busyTicketTypeId === ticketType.id}
                        onSave={(label, color) =>
                          updatePresentation(ticketType, label, color)
                        }
                        onUpload={(file) => replaceImage(ticketType, file)}
                        onRemoveImage={() => removeImage(ticketType)}
                      />
                      <TicketTypeAgePolicyEditor
                        ticketType={ticketType}
                        disabled={busyTicketTypeId === ticketType.id}
                        onSave={(nextMinimumAge, nextMaximumAge) =>
                          updateAgePolicy(
                            ticketType,
                            nextMinimumAge,
                            nextMaximumAge,
                          )
                        }
                      />
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-dashed p-5">
            <p className="font-medium">No Ticket Types yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create the first admission option for this Event.
            </p>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={onReturnToReadiness}
        >
          Return to Event readiness
        </Button>
      </section>

      <section className="rounded-xl border bg-card p-6">
        {role === "OWNER" ? (
          <>
            <p className="text-sm font-medium text-muted-foreground">
              Event setup
            </p>
            <h2 className="mt-2 text-xl font-semibold">Create a Ticket Type</h2>
            <form onSubmit={createTicketType} className="mt-6 space-y-5">
              <label className="block text-sm font-medium">
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={200}
                  className="mt-2 h-10 w-full rounded-lg border bg-background px-3"
                />
              </label>
              <label className="block text-sm font-medium">
                Description <span className="font-normal">(optional)</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={2000}
                  rows={3}
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
                />
              </label>
              <label className="block text-sm font-medium">
                Price (AUD)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  required
                  className="mt-2 h-10 w-full rounded-lg border bg-background px-3"
                />
              </label>

              <fieldset className="rounded-lg border p-4">
                <legend className="px-1 text-sm font-medium">
                  Age range (optional)
                </legend>
                <p className="text-xs leading-5 text-muted-foreground">
                  Used to choose a valid walk-up age for Rules. For example,
                  Toddler 0–4 defaults to 4, Child 5–14 defaults to 14, and
                  Adult 18+ defaults to 18.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="text-sm font-medium">
                    Minimum age
                    <input
                      type="number"
                      min="0"
                      max="130"
                      value={minimumAge}
                      onChange={(event) => setMinimumAge(event.target.value)}
                      className="mt-2 h-10 w-full rounded-lg border bg-background px-3"
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Maximum age
                    <input
                      type="number"
                      min="0"
                      max="130"
                      value={maximumAge}
                      onChange={(event) => setMaximumAge(event.target.value)}
                      className="mt-2 h-10 w-full rounded-lg border bg-background px-3"
                    />
                  </label>
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <label className="block text-sm font-medium">
                  Tile label <span className="font-normal">(optional)</span>
                  <input
                    value={tileLabel}
                    onChange={(event) => setTileLabel(event.target.value)}
                    maxLength={24}
                    placeholder={name || "ADULT"}
                    className="mt-2 h-10 w-full rounded-lg border bg-background px-3"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Tile colour
                  <input
                    type="color"
                    value={tileColor}
                    onChange={(event) =>
                      setTileColor(event.target.value.toUpperCase())
                    }
                    className="mt-2 h-10 w-full rounded-lg border bg-background p-1"
                  />
                </label>
              </div>

              <div
                className="flex h-24 items-center justify-center rounded-xl text-xl font-bold tracking-wide text-white"
                style={{ backgroundColor: tileColor }}
              >
                {tileLabel.trim() || name.trim() || "TICKET"}
              </div>

              <label className="block rounded-lg border border-dashed p-4 text-sm font-medium">
                Ticket Type image{" "}
                <span className="font-normal">(optional)</span>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  Most Ticket Types work best as a clear text-and-colour tile.
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(event) =>
                    setImage(event.target.files?.[0] ?? null)
                  }
                  className="mt-3 block w-full text-xs"
                />
              </label>

              <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-6">
                Rink capacity is configured on Sessions and shared across Adult,
                Child and other Ticket Types.
              </div>

              {error ? (
                <p
                  role="alert"
                  className="text-sm font-medium text-destructive"
                >
                  {error}
                </p>
              ) : null}
              {savedMessage ? (
                <p
                  role="status"
                  className="text-sm font-medium text-emerald-700"
                >
                  {savedMessage}
                </p>
              ) : null}

              <Button type="submit" size="lg" disabled={isSaving}>
                {isSaving ? "Creating..." : "Create active Ticket Type"}
              </Button>
            </form>
          </>
        ) : (
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Read-only access
            </p>
            <h2 className="mt-2 text-xl font-semibold">Ticket Type setup</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Event owners can create Ticket Types. You can review the current
              admission catalogue.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
