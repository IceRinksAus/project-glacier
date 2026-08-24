"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  PublicRequiredProduct,
  PublicSessionProduct,
  publicBookingService,
} from "@/services/public-booking.service";

export interface SelectedBookingProduct {
  productId: string;
  productVariantId?: string;
  quantity: number;
  name: string;
  slug: string;
  price: number;
}

interface AddOnsStepProps {
  sessionId: string;
  requiredProducts?: PublicRequiredProduct[];
  initialProducts?: SelectedBookingProduct[];
  disabled?: boolean;
  onChange: (products: SelectedBookingProduct[], subtotal: number) => void;
}

interface ProductChoice {
  key: string;
  productId: string;
  productVariantId?: string;
  productSlug: string;
  name: string;
  description: string | null;
  price: number;
  maximum: number | null;
  remainingQuantity: number | null;
  groupId: string | null;
  groupName: string;
  groupDescription: string | null;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

function minimumLimit(...limits: Array<number | null>) {
  const configured = limits.filter((limit): limit is number => limit !== null);
  return configured.length > 0 ? Math.min(...configured) : null;
}

function buildChoices(sessionProducts: PublicSessionProduct[]) {
  return sessionProducts.flatMap<ProductChoice>((sessionProduct) => {
    const { product } = sessionProduct;

    if (product.variants.length === 0) {
      return [{
        key: product.id,
        productId: product.id,
        productSlug: product.slug,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        maximum: minimumLimit(
          product.maxQuantity,
          sessionProduct.remainingQuantity,
        ),
        remainingQuantity: sessionProduct.remainingQuantity,
        groupId: product.productGroup?.id ?? null,
        groupName: product.productGroup?.name ?? "Other add-ons",
        groupDescription: product.productGroup?.description ?? null,
      }];
    }

    return product.variants.map((variant) => ({
      key: `${product.id}:${variant.id}`,
      productId: product.id,
      productVariantId: variant.id,
      productSlug: product.slug,
      name: `${product.name} — ${variant.name}`,
      description: variant.description ?? product.description,
      price: Number(variant.priceOverride ?? product.price),
      maximum: minimumLimit(
        product.maxQuantity,
        sessionProduct.remainingQuantity,
        variant.remainingQuantity,
      ),
      remainingQuantity: minimumLimit(
        sessionProduct.remainingQuantity,
        variant.remainingQuantity,
      ),
      groupId: product.productGroup?.id ?? null,
      groupName: product.productGroup?.name ?? "Other add-ons",
      groupDescription: product.productGroup?.description ?? null,
    }));
  });
}

export function AddOnsStep({
  sessionId,
  requiredProducts = [],
  initialProducts = [],
  disabled = false,
  onChange,
}: AddOnsStepProps) {
  const [sessionProducts, setSessionProducts] = useState<PublicSessionProduct[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialProductsRef = useRef(initialProducts);

  useEffect(() => {
    let isCurrent = true;

    publicBookingService
      .getSessionProducts(sessionId)
      .then((result) => {
        if (!isCurrent) return;
        setSessionProducts(result);
        setQuantities(Object.fromEntries(
          initialProductsRef.current.map((product) => [
            product.productVariantId
              ? `${product.productId}:${product.productVariantId}`
              : product.productId,
            product.quantity,
          ]),
        ));
        setError(null);
      })
      .catch((loadError) => {
        if (!isCurrent) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load add-ons.",
        );
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [sessionId]);

  const choices = useMemo(() => buildChoices(sessionProducts), [sessionProducts]);
  const choiceGroups = useMemo(
    () => Array.from(
      choices.reduce((groups, choice) => {
        const key = choice.groupId ?? "ungrouped";
        const existing = groups.get(key);
        if (existing) {
          existing.choices.push(choice);
        } else {
          groups.set(key, {
            key,
            name: choice.groupName,
            description: choice.groupDescription,
            choices: [choice],
          });
        }
        return groups;
      }, new Map<string, {
        key: string;
        name: string;
        description: string | null;
        choices: ProductChoice[];
      }>()).values(),
    ),
    [choices],
  );
  const requiredQuantityBySlug = useMemo(
    () => new Map(
      requiredProducts.map((requiredProduct) => [
        requiredProduct.productSlug,
        requiredProduct.quantity,
      ]),
    ),
    [requiredProducts],
  );

  const selectedProducts = useMemo(
    () => choices
      .map((choice) => ({
        productId: choice.productId,
        ...(choice.productVariantId
          ? { productVariantId: choice.productVariantId }
          : {}),
        quantity: Math.max(
          quantities[choice.key] ?? 0,
          choice.productVariantId
            ? 0
            : (requiredQuantityBySlug.get(choice.productSlug) ?? 0),
        ),
        name: choice.name,
        slug: choice.productSlug,
        price: choice.price,
      }))
      .filter((product) => product.quantity > 0),
    [choices, quantities, requiredQuantityBySlug],
  );

  const subtotal = useMemo(
    () => selectedProducts.reduce(
      (total, product) => total + product.price * product.quantity,
      0,
    ),
    [selectedProducts],
  );

  useEffect(() => {
    onChange(selectedProducts, subtotal);
  }, [onChange, selectedProducts, subtotal]);

  const unavailableRequiredProducts = requiredProducts.filter(
    (requiredProduct) => !choices.some(
      (choice) =>
        choice.productSlug === requiredProduct.productSlug &&
        !choice.productVariantId &&
        (choice.maximum === null || requiredProduct.quantity <= choice.maximum),
    ),
  );

  function requiredMinimum(choice: ProductChoice) {
    return choice.productVariantId
      ? 0
      : (requiredQuantityBySlug.get(choice.productSlug) ?? 0);
  }

  function selectedQuantity(choice: ProductChoice) {
    return Math.max(quantities[choice.key] ?? 0, requiredMinimum(choice));
  }

  function updateQuantity(choice: ProductChoice, change: number) {
    if (disabled) return;

    setQuantities((current) => {
      const minimum = requiredMinimum(choice);
      let next = Math.max(minimum, (current[choice.key] ?? minimum) + change);
      if (choice.maximum !== null) next = Math.min(next, choice.maximum);
      return { ...current, [choice.key]: next };
    });
  }

  return (
    <section className="rounded-2xl border bg-card p-8">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Step 5 of 9
      </p>
      <h2 className="mt-2 text-2xl font-semibold">Add-ons</h2>
      <p className="mt-2 text-muted-foreground">
        Add any extras available for your selected session.
      </p>

      {requiredProducts.length > 0 ? (
        <div className="mt-6 rounded-xl border bg-muted/30 p-5">
          <p className="font-medium">Required for this booking</p>
          {requiredProducts.map((requiredProduct) => (
            <div key={requiredProduct.productSlug} className="mt-2 text-sm">
              <p>Required quantity: {requiredProduct.quantity}</p>
              {requiredProduct.messages.map((message) => (
                <p key={message} className="mt-1 text-muted-foreground">
                  {message}
                </p>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading add-ons...</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-6 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      {!isLoading && !error && unavailableRequiredProducts.length > 0 ? (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="font-medium text-destructive">Required add-on unavailable</p>
          <p className="mt-1 text-sm text-destructive">
            A Product required by the booking rules does not have enough
            availability for this Session.
          </p>
        </div>
      ) : null}
      {!isLoading && !error && choices.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          There are no add-ons available for this session.
        </p>
      ) : null}

      {!isLoading && !error && choices.length > 0 ? (
        <div className="mt-6 space-y-8">
          {choiceGroups.map((group) => (
            <section key={group.key} aria-labelledby={`add-on-group-${group.key}`}>
              <h3 id={`add-on-group-${group.key}`} className="text-xl font-semibold">
                {group.name}
              </h3>
              {group.description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {group.description}
                </p>
              ) : null}
              <div className="mt-3 grid gap-3">
          {group.choices.map((choice) => {
            const quantity = selectedQuantity(choice);
            const minimum = requiredMinimum(choice);
            const atMaximum =
              choice.maximum !== null && quantity >= choice.maximum;

            return (
              <div
                key={choice.key}
                className="flex flex-col gap-4 rounded-xl border bg-background p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="font-semibold">{choice.name}</h4>
                    <span className="text-sm font-medium">
                      {formatCurrency(choice.price)}
                    </span>
                    {minimum > 0 ? (
                      <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                        Required
                      </span>
                    ) : null}
                  </div>
                  {choice.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {choice.description}
                    </p>
                  ) : null}
                  {minimum > 0 ? (
                    <p className="mt-2 text-sm font-medium">
                      Minimum required: {minimum}
                    </p>
                  ) : null}
                  {choice.remainingQuantity !== null ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {choice.remainingQuantity} remaining
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={disabled || quantity <= minimum}
                    onClick={() => updateQuantity(choice, -1)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border text-lg font-medium disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Remove one ${choice.name}`}
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-lg font-semibold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={disabled || atMaximum}
                    onClick={() => updateQuantity(choice, 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border text-lg font-medium disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Add one ${choice.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {subtotal > 0 ? (
        <div className="mt-6 flex items-center justify-between rounded-xl border bg-muted/30 p-5">
          <p className="font-medium">Add-ons subtotal</p>
          <p className="text-2xl font-semibold">{formatCurrency(subtotal)}</p>
        </div>
      ) : null}
    </section>
  );
}
