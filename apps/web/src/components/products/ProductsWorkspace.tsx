"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { Button } from "@/components/ui/button";
import {
  getAuthRoleSnapshot,
  getServerAuthRoleSnapshot,
  subscribeAuthSession,
} from "@/lib/auth";
import {
  ProductAdministration,
  productSetupService,
} from "@/services/product-setup.service";
import { Session, sessionService } from "@/services/session.service";
import { TicketType, ticketTypeService } from "@/services/ticket-type.service";

type AvailabilityModel = "UNLIMITED" | "SESSION_CAPACITY" | "VARIANT_INVENTORY";

interface VariantDraft {
  name: string;
  inventoryQuantity: string;
  priceOverride: string;
}

interface ProductsWorkspaceProps {
  eventId: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value));
}

function modelLabel(product: ProductAdministration) {
  if (product.variants.length > 0) return "Finite Variant inventory";
  if (product.capacityControlled) return "Per-Session capacity";
  if (product.inventoryTracked) return "Finite inventory";
  return "Unlimited availability";
}

export function ProductsWorkspace({ eventId }: ProductsWorkspaceProps) {
  const role = useSyncExternalStore(
    subscribeAuthSession,
    getAuthRoleSnapshot,
    getServerAuthRoleSnapshot,
  );
  const [products, setProducts] = useState<ProductAdministration[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [availabilityModel, setAvailabilityModel] =
    useState<AvailabilityModel>("UNLIMITED");
  const [defaultCapacity, setDefaultCapacity] = useState("");
  const [variants, setVariants] = useState<VariantDraft[]>([
    { name: "", inventoryQuantity: "", priceOverride: "" },
  ]);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [requiredTicketTypeIds, setRequiredTicketTypeIds] = useState<string[]>([]);

  const loadWorkspace = useCallback(async () => {
    const [productResult, sessionResult, ticketTypeResult] = await Promise.all([
      productSetupService.findForEvent(eventId),
      sessionService.getSessions(eventId),
      ticketTypeService.findForEvent(eventId),
    ]);
    setProducts(productResult);
    setSessions(sessionResult.filter((session) => session.status === "ACTIVE"));
    setTicketTypes(ticketTypeResult.filter((ticketType) => ticketType.active));
  }, [eventId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWorkspace()
        .catch((loadError) =>
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load Product setup.",
          ),
        )
        .finally(() => setIsLoading(false));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  function resetBuilder() {
    setStep(1);
    setName("");
    setSlug("");
    setSlugEdited(false);
    setDescription("");
    setPrice("");
    setAvailabilityModel("UNLIMITED");
    setDefaultCapacity("");
    setVariants([{ name: "", inventoryQuantity: "", priceOverride: "" }]);
    setSelectedSessionIds([]);
    setRequiredTicketTypeIds([]);
  }

  function continueFromDetails() {
    if (!name.trim() || !slug || Number(price) < 0 || price === "") {
      setError("Enter a Product name, stable slug and non-negative price.");
      return;
    }
    setError("");
    setStep(2);
  }

  function continueFromAvailability() {
    if (
      availabilityModel === "SESSION_CAPACITY" &&
      (!/^\d+$/.test(defaultCapacity) || Number(defaultCapacity) < 1)
    ) {
      setError("Enter a default reusable capacity of at least 1.");
      return;
    }
    if (
      availabilityModel === "VARIANT_INVENTORY" &&
      variants.some(
        (variant) =>
          !variant.name.trim() ||
          !/^\d+$/.test(variant.inventoryQuantity) ||
          Number(variant.inventoryQuantity) < 0 ||
          (variant.priceOverride !== "" && Number(variant.priceOverride) < 0),
      )
    ) {
      setError("Each Variant needs a name and whole non-negative inventory.");
      return;
    }
    setError("");
    if (availabilityModel === "VARIANT_INVENTORY") {
      setRequiredTicketTypeIds([]);
    }
    setStep(3);
  }

  function continueFromSessions() {
    if (selectedSessionIds.length === 0) {
      setError("Select at least one active Session for this Product.");
      return;
    }
    setError("");
    setStep(4);
  }

  function toggleSelection(
    value: string,
    selected: string[],
    update: (next: string[]) => void,
  ) {
    update(
      selected.includes(value)
        ? selected.filter((candidate) => candidate !== value)
        : [...selected, value],
    );
  }

  async function createConfiguredProduct() {
    setIsSaving(true);
    setError("");
    setMessage("");
    let draftId = "";

    try {
      const product = await productSetupService.createProduct({
        eventId,
        name: name.trim(),
        slug,
        ...(description.trim() ? { description: description.trim() } : {}),
        productType: "ADD_ON",
        price: Number(price),
        gstRate: 10,
        inventoryTracked: false,
        capacityControlled: availabilityModel === "SESSION_CAPACITY",
        ...(availabilityModel === "SESSION_CAPACITY"
          ? { capacity: Number(defaultCapacity) }
          : {}),
        requiresSession: true,
        availableOnline: true,
        availablePos: true,
        minQuantity: 0,
      });
      draftId = product.id;

      if (availabilityModel === "VARIANT_INVENTORY") {
        for (const [index, variant] of variants.entries()) {
          await productSetupService.createVariant({
            productId: product.id,
            name: variant.name.trim(),
            slug: slugify(variant.name),
            ...(variant.priceOverride !== ""
              ? { priceOverride: Number(variant.priceOverride) }
              : {}),
            status: "ACTIVE",
            inventoryTracked: true,
            inventoryQuantity: Number(variant.inventoryQuantity),
            availableOnline: true,
            availablePos: true,
            sortOrder: index,
          });
        }
      }

      const assignmentBatchSize = 10;
      for (
        let offset = 0;
        offset < selectedSessionIds.length;
        offset += assignmentBatchSize
      ) {
        await Promise.all(
          selectedSessionIds
            .slice(offset, offset + assignmentBatchSize)
            .map((sessionId) =>
              productSetupService.assignToSession(sessionId, product.id),
            ),
        );
      }

      if (requiredTicketTypeIds.length > 0) {
        await productSetupService.createRequirementRule({
          eventId,
          name: `${product.name} requirement`,
          slug: `${product.slug}-required-by-ticket-type`,
          description: `Requires one ${product.name} for each matching Ticket Type participant.`,
          ruleType: "PRODUCT_REQUIREMENT",
          scope: "PARTICIPANT",
          status: "ACTIVE",
          priority: 100,
          conditions: {
            all: [
              {
                field: "ticketTypeId",
                operator: "IN",
                value: requiredTicketTypeIds,
              },
            ],
          },
          actions: {
            type: "REQUIRE_PRODUCT",
            productSlug: product.slug,
            quantityPerMatchingItem: 1,
          },
          message: `${product.name} is required for this Ticket Type.`,
          stopProcessing: false,
        });
      }

      await productSetupService.updateStatus(product.id, "ACTIVE");
      await loadWorkspace();
      resetBuilder();
      setMessage(`${product.name} was configured and activated.`);
    } catch (saveError) {
      setError(
        `${
          saveError instanceof Error
            ? saveError.message
            : "Unable to complete Product setup."
        }${draftId ? " The partial Product remains safely in DRAFT." : ""}`,
      );
      await loadWorkspace().catch(() => undefined);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-xl border bg-card p-6">
        <p className="text-sm font-medium text-muted-foreground">Catalogue</p>
        <h2 className="mt-2 text-2xl font-semibold">Products</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Products are optional extras and do not consume rink admission capacity.
        </p>
        {isLoading ? <p className="mt-6 text-sm">Loading Products...</p> : null}
        {!isLoading && products.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No Products configured for this Event.
          </p>
        ) : null}
        <div className="mt-6 space-y-3">
          {products.map((product) => (
            <article key={product.id} className="rounded-lg border p-4">
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {modelLabel(product)} · {product.sessionProducts.length} Session
                    {product.sessionProducts.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="text-xs font-medium">{product.status}</span>
              </div>
              <p className="mt-3 text-sm font-semibold">{formatPrice(product.price)}</p>
              {product.variants.length > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {product.variants.length} Variant
                  {product.variants.length === 1 ? "" : "s"}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6">
        {role !== "OWNER" ? (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Read-only access</p>
            <h2 className="mt-2 text-xl font-semibold">Product setup</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Event owners can configure and activate Products.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Guided Product setup · Step {step} of 4
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  {step === 1
                    ? "Product details"
                    : step === 2
                      ? "Availability model"
                      : step === 3
                        ? "Session availability"
                        : "Requirements and review"}
                </h2>
              </div>
            </div>

            {step === 1 ? (
              <div className="mt-6 space-y-5">
                <label className="block text-sm font-medium">
                  Product name
                  <input
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (!slugEdited) setSlug(slugify(event.target.value));
                    }}
                    className="mt-2 h-10 w-full rounded-lg border px-3"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Stable slug
                  <input
                    value={slug}
                    onChange={(event) => {
                      setSlug(slugify(event.target.value));
                      setSlugEdited(true);
                    }}
                    className="mt-2 h-10 w-full rounded-lg border px-3"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Description <span className="font-normal">(optional)</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-lg border px-3 py-2"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Base price (AUD)
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    className="mt-2 h-10 w-full rounded-lg border px-3"
                  />
                </label>
                <Button onClick={continueFromDetails}>Continue</Button>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="mt-6 space-y-5">
                {([
                  ["UNLIMITED", "Unlimited", "No Product-specific stock limit."],
                  [
                    "SESSION_CAPACITY",
                    "Reusable per Session",
                    "Kangas or hire equipment that resets for each Session.",
                  ],
                  [
                    "VARIANT_INVENTORY",
                    "Finite Variant inventory",
                    "Merchandise sizes or options with independent global stock.",
                  ],
                ] as const).map(([value, label, help]) => (
                  <label key={value} className="flex gap-3 rounded-lg border p-4">
                    <input
                      type="radio"
                      name="availability-model"
                      aria-label={label}
                      checked={availabilityModel === value}
                      onChange={() => setAvailabilityModel(value)}
                    />
                    <span>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {help}
                      </span>
                    </span>
                  </label>
                ))}
                {availabilityModel === "SESSION_CAPACITY" ? (
                  <label className="block text-sm font-medium">
                    Default capacity per Session
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={defaultCapacity}
                      onChange={(event) => setDefaultCapacity(event.target.value)}
                      className="mt-2 h-10 w-full rounded-lg border px-3"
                    />
                  </label>
                ) : null}
                {availabilityModel === "VARIANT_INVENTORY" ? (
                  <div className="space-y-3">
                    {variants.map((variant, index) => (
                      <div key={index} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
                        <input
                          aria-label={`Variant ${index + 1} name`}
                          placeholder="Size or option"
                          value={variant.name}
                          onChange={(event) =>
                            setVariants((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, name: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="h-10 rounded-lg border px-3"
                        />
                        <input
                          aria-label={`Variant ${index + 1} inventory`}
                          type="number"
                          min={0}
                          step={1}
                          placeholder="Inventory"
                          value={variant.inventoryQuantity}
                          onChange={(event) =>
                            setVariants((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, inventoryQuantity: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="h-10 rounded-lg border px-3"
                        />
                        <input
                          aria-label={`Variant ${index + 1} price override`}
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Price override"
                          value={variant.priceOverride}
                          onChange={(event) =>
                            setVariants((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, priceOverride: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="h-10 rounded-lg border px-3"
                        />
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() =>
                        setVariants((current) => [
                          ...current,
                          { name: "", inventoryQuantity: "", priceOverride: "" },
                        ])
                      }
                    >
                      Add Variant
                    </Button>
                  </div>
                ) : null}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={continueFromAvailability}>Continue</Button>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose every active Session where this Product can be selected.
                </p>
                {sessions.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-4">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setSelectedSessionIds(
                          sessions.map((session) => session.id),
                        )
                      }
                    >
                      Apply to all active Sessions
                    </Button>
                    {selectedSessionIds.length > 0 ? (
                      <Button
                        variant="outline"
                        onClick={() => setSelectedSessionIds([])}
                      >
                        Clear all
                      </Button>
                    ) : null}
                    <span className="text-sm text-muted-foreground">
                      {selectedSessionIds.length} of {sessions.length} selected
                    </span>
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Create an active Session before configuring this Product.
                  </p>
                )}
                {sessions.map((session) => (
                  <label key={session.id} className="flex gap-3 rounded-lg border p-4 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSessionIds.includes(session.id)}
                      onChange={() =>
                        toggleSelection(
                          session.id,
                          selectedSessionIds,
                          setSelectedSessionIds,
                        )
                      }
                    />
                    <span>
                      <span className="block font-medium">{session.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.startDate).toLocaleString("en-AU")}
                      </span>
                    </span>
                  </label>
                ))}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button onClick={continueFromSessions}>Continue</Button>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="mt-6 space-y-5">
                {availabilityModel !== "VARIANT_INVENTORY" ? (
                <div>
                  <p className="text-sm font-medium">Required by Ticket Types</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Optional. One Product will be required per matching participant.
                  </p>
                  <div className="mt-3 space-y-2">
                    {ticketTypes.map((ticketType) => (
                      <label key={ticketType.id} className="flex gap-3 rounded-lg border p-3 text-sm">
                        <input
                          type="checkbox"
                          checked={requiredTicketTypeIds.includes(ticketType.id)}
                          onChange={() =>
                            toggleSelection(
                              ticketType.id,
                              requiredTicketTypeIds,
                              setRequiredTicketTypeIds,
                            )
                          }
                        />
                        {ticketType.name}
                      </label>
                    ))}
                  </div>
                </div>
                ) : (
                  <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                    Variant merchandise remains optional so customers can choose their own size or option. Ticket Type requirements are available for unambiguous Products such as Kangas.
                  </div>
                )}
                <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-6">
                  <strong>{name}</strong> · {formatPrice(Number(price))} · {availabilityModel.replaceAll("_", " ")} · {selectedSessionIds.length} Session
                  {selectedSessionIds.length === 1 ? "" : "s"} · {requiredTicketTypeIds.length} requirement
                  {requiredTicketTypeIds.length === 1 ? "" : "s"}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                  <Button disabled={isSaving} onClick={() => void createConfiguredProduct()}>
                    {isSaving ? "Configuring..." : "Create and activate Product"}
                  </Button>
                </div>
              </div>
            ) : null}

            {error ? (
              <p role="alert" className="mt-5 text-sm font-medium text-destructive">
                {error}
              </p>
            ) : null}
            {message ? (
              <p role="status" className="mt-5 text-sm font-medium text-emerald-700">
                {message}
              </p>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
