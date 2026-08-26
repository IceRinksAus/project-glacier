"use client";

import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  RetailCatalogue,
  RetailSale,
  posService,
} from "@/services/pos.service";

function money(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

export function MerchandiseSaleMode({ eventId }: { eventId: string }) {
  const [catalogue, setCatalogue] = useState<RetailCatalogue | null>(null);
  const [basket, setBasket] = useState<
    Record<string, { quantity: number; productVariantId?: string }>
  >({});
  const [sale, setSale] = useState<RetailSale | null>(null);
  const [completion, setCompletion] = useState<RetailSale | null>(null);
  const [method, setMethod] = useState<"CASH" | "STANDALONE_EFTPOS">(
    "STANDALONE_EFTPOS",
  );
  const [reference, setReference] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCatalogue(null);
    setBasket({});
    setSale(null);
    setCompletion(null);
    if (!eventId) return;
    setWorking(true);
    posService
      .getMerchandiseCatalogue(eventId)
      .then(setCatalogue)
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load merchandise.",
        ),
      )
      .finally(() => setWorking(false));
  }, [eventId]);

  const total = useMemo(() => {
    if (!catalogue) return 0;
    return catalogue.products.reduce((sum, product) => {
      const selection = basket[product.id];
      if (!selection?.quantity) return sum;
      const variant = product.variants.find(
        ({ id }) => id === selection.productVariantId,
      );
      return (
        sum + (variant?.priceOverride ?? product.price) * selection.quantity
      );
    }, 0);
  }, [basket, catalogue]);

  function update(
    productId: string,
    quantity: number,
    productVariantId?: string,
  ) {
    setBasket((current) => ({
      ...current,
      [productId]: { quantity: Math.max(0, quantity), productVariantId },
    }));
  }

  async function review() {
    if (!eventId) return;
    const items = Object.entries(basket)
      .filter(([, value]) => value.quantity > 0)
      .map(([productId, value]) => ({ productId, ...value }));
    if (!items.length) return setError("Add at least one merchandise item.");
    const missingVariant = items.find(({ productId, productVariantId }) => {
      const product = catalogue?.products.find(({ id }) => id === productId);
      return product && product.variants.length > 0 && !productVariantId;
    });
    if (missingVariant)
      return setError("Choose a Variant for every selected item.");
    setWorking(true);
    setError("");
    try {
      setSale(await posService.createRetailSale(eventId, items));
      setIdempotencyKey(crypto.randomUUID());
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to reserve stock.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function complete() {
    if (!sale || !idempotencyKey) return;
    setWorking(true);
    setError("");
    try {
      setCompletion(
        await posService.completeRetailSale(eventId, sale.id, {
          method,
          amount: sale.total,
          idempotencyKey,
          standaloneReference:
            method === "STANDALONE_EFTPOS" ? reference || undefined : undefined,
        }),
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to complete Sale.",
      );
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    setBasket({});
    setSale(null);
    setCompletion(null);
    setReference("");
    setIdempotencyKey("");
    setError("");
  }

  if (!eventId) {
    return (
      <p className="rounded-xl border bg-card p-5 text-muted-foreground">
        Choose an Event to start a merchandise Sale.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!sale ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Merchandise</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              No Session, participant or purchaser details are required.
            </p>
            <div className="mt-4 space-y-3">
              {catalogue?.products.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No merchandise is currently available at POS.
                </p>
              ) : null}
              {catalogue?.products.map((product) => {
                const selection = basket[product.id] ?? { quantity: 0 };
                const selectedVariant = product.variants.find(
                  ({ id }) => id === selection.productVariantId,
                );
                const remaining = selectedVariant
                  ? selectedVariant.remainingInventory
                  : product.remainingInventory;
                return (
                  <div key={product.id} className="rounded-lg border p-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {money(
                            selectedVariant?.priceOverride ?? product.price,
                          )}
                          {product.productGroup
                            ? ` · ${product.productGroup.name}`
                            : ""}
                        </p>
                        {remaining !== null ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {remaining} remaining
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Stock is not quantity-tracked
                          </p>
                        )}
                        {product.variants.length ? (
                          <select
                            aria-label={`${product.name} Variant`}
                            className="mt-2 rounded-md border px-3 py-2 text-sm"
                            value={selection.productVariantId ?? ""}
                            onChange={(event) =>
                              update(
                                product.id,
                                selection.quantity,
                                event.target.value || undefined,
                              )
                            }
                          >
                            <option value="">Choose Variant</option>
                            {product.variants.map((variant) => (
                              <option key={variant.id} value={variant.id}>
                                {variant.name}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          aria-label={`Remove one ${product.name}`}
                          onClick={() =>
                            update(
                              product.id,
                              selection.quantity - 1,
                              selection.productVariantId,
                            )
                          }
                        >
                          <Minus className="size-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">
                          {selection.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          aria-label={`Add one ${product.name}`}
                          disabled={
                            remaining !== null &&
                            selection.quantity >= remaining
                          }
                          onClick={() =>
                            update(
                              product.id,
                              selection.quantity + 1,
                              selection.productVariantId,
                            )
                          }
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <aside className="h-fit space-y-5 rounded-xl border bg-card p-5 shadow-sm xl:sticky xl:top-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-5" />
              <h2 className="text-xl font-semibold">Merchandise Sale</h2>
            </div>
            <p className="text-3xl font-bold">{money(total)}</p>
            <Button
              className="w-full"
              size="lg"
              disabled={working || total <= 0}
              onClick={review}
            >
              {working ? "Reserving stock…" : "Review payment"}
            </Button>
          </aside>
        </div>
      ) : null}

      {sale && !completion ? (
        <section className="mx-auto max-w-2xl space-y-5 rounded-xl border bg-card p-6 shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground">
              Sale {sale.saleNumber}
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Confirm payment received
            </h2>
            <p className="mt-3 text-4xl font-bold">{money(sale.total)}</p>
          </div>
          <div className="space-y-2 rounded-lg border p-4 text-sm">
            {sale.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4">
                <span>
                  {item.quantity} × {item.productNameSnapshot}
                  {item.variantNameSnapshot
                    ? ` · ${item.variantNameSnapshot}`
                    : ""}
                </span>
                <strong>{money(item.lineTotal)}</strong>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className={`rounded-xl border p-5 text-left ${method === "STANDALONE_EFTPOS" ? "border-primary bg-primary/5" : ""}`}
              onClick={() => setMethod("STANDALONE_EFTPOS")}
            >
              <CreditCard className="size-6" />
              <span className="mt-3 block font-semibold">
                Standalone EFTPOS
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Confirm only after the terminal approves.
              </span>
            </button>
            <button
              type="button"
              className={`rounded-xl border p-5 text-left ${method === "CASH" ? "border-primary bg-primary/5" : ""}`}
              onClick={() => setMethod("CASH")}
            >
              <Banknote className="size-6" />
              <span className="mt-3 block font-semibold">Cash</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Confirm the exact amount was received.
              </span>
            </button>
          </div>
          {method === "STANDALONE_EFTPOS" ? (
            <label className="block text-sm font-medium">
              Terminal receipt/reference (optional)
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
            </label>
          ) : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              disabled={working}
              onClick={() => setSale(null)}
            >
              Return to basket
            </Button>
            <Button size="lg" disabled={working} onClick={complete}>
              {working
                ? "Completing…"
                : `Confirm ${money(sale.total)} received`}
            </Button>
          </div>
        </section>
      ) : null}

      {completion ? (
        <section className="mx-auto max-w-2xl rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-950">
          <CheckCircle2 className="size-10" />
          <h2 className="mt-4 text-2xl font-semibold">
            Merchandise Sale complete
          </h2>
          <p className="mt-2">
            Sale {completion.saleNumber} is paid. No Booking or Ticket was
            created.
          </p>
          <p className="mt-3 text-3xl font-bold">{money(completion.total)}</p>
          <p className="mt-2 text-sm">
            Received by{" "}
            {completion.completedByUser?.name ?? "authorised operator"}
          </p>
          <Button className="mt-6" onClick={reset}>
            Start next Sale
          </Button>
        </section>
      ) : null}
    </div>
  );
}
