"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  PublicRequiredProduct,
  PublicSessionProduct,
  publicBookingService,
} from "@/services/public-booking.service";

export interface SelectedBookingProduct {
  productId: string;
  quantity: number;
  name: string;
  slug: string;
  price: number;
}

interface AddOnsStepProps {
  sessionId: string;
  requiredProducts?: PublicRequiredProduct[];
  disabled?: boolean;
  onChange: (
    products: SelectedBookingProduct[],
    subtotal: number,
  ) => void;
}

function formatCurrency(
  amount: number,
) {
  return new Intl.NumberFormat(
    "en-AU",
    {
      style: "currency",
      currency: "AUD",
    },
  ).format(amount);
}

export function AddOnsStep({
  sessionId,
  requiredProducts = [],
  disabled = false,
  onChange,
}: AddOnsStepProps) {
  const [
    sessionProducts,
    setSessionProducts,
  ] = useState<
    PublicSessionProduct[]
  >([]);

  const [
    quantities,
    setQuantities,
  ] = useState<
    Record<string, number>
  >({});

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setIsLoading(true);
        setError(null);
        setQuantities({});

        const result =
          await publicBookingService.getSessionProducts(
            sessionId,
          );

        if (!isMounted) {
          return;
        }

        setSessionProducts(result);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load add-ons.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const requiredQuantityBySlug =
    useMemo(() => {
      const requirements =
        new Map<string, number>();

      for (
        const requiredProduct of
        requiredProducts
      ) {
        requirements.set(
          requiredProduct.productSlug,
          requiredProduct.quantity,
        );
      }

      return requirements;
    }, [requiredProducts]);

  useEffect(() => {
    if (
      sessionProducts.length === 0
    ) {
      return;
    }

    setQuantities(
      (currentQuantities) => {
        let changed = false;

        const nextQuantities = {
          ...currentQuantities,
        };

        for (
          const sessionProduct of
          sessionProducts
        ) {
          const requiredQuantity =
            requiredQuantityBySlug.get(
              sessionProduct.product.slug,
            ) ?? 0;

          const currentQuantity =
            nextQuantities[
              sessionProduct.productId
            ] ?? 0;

          if (
            currentQuantity <
            requiredQuantity
          ) {
            nextQuantities[
              sessionProduct.productId
            ] = requiredQuantity;

            changed = true;
          }
        }

        return changed
          ? nextQuantities
          : currentQuantities;
      },
    );
  }, [
    requiredQuantityBySlug,
    sessionProducts,
  ]);

  const selectedProducts =
    useMemo(
      () =>
        sessionProducts
          .map(
            (sessionProduct) => ({
              productId:
                sessionProduct.productId,
              quantity:
                quantities[
                  sessionProduct.productId
                ] ?? 0,
              name:
                sessionProduct.product.name,
              slug:
                sessionProduct.product.slug,
              price:
                sessionProduct.product.price,
            }),
          )
          .filter(
            (product) =>
              product.quantity > 0,
          ),
      [
        quantities,
        sessionProducts,
      ],
    );

  const subtotal = useMemo(
    () =>
      sessionProducts.reduce(
        (
          total,
          sessionProduct,
        ) =>
          total +
          sessionProduct.product
            .price *
            (quantities[
              sessionProduct.productId
            ] ?? 0),
        0,
      ),
    [
      quantities,
      sessionProducts,
    ],
  );

  useEffect(() => {
    onChange(
      selectedProducts,
      subtotal,
    );
  }, [
    onChange,
    selectedProducts,
    subtotal,
  ]);

  const unavailableRequiredProducts =
    useMemo(
      () =>
        requiredProducts.filter(
          (requiredProduct) =>
            !sessionProducts.some(
              (sessionProduct) =>
                sessionProduct.product
                  .slug ===
                requiredProduct.productSlug,
            ),
        ),
      [
        requiredProducts,
        sessionProducts,
      ],
    );

  const invalidMaximumRequirements =
    useMemo(
      () =>
        requiredProducts.filter(
          (requiredProduct) => {
            const sessionProduct =
              sessionProducts.find(
                (candidate) =>
                  candidate.product.slug ===
                  requiredProduct.productSlug,
              );

            if (!sessionProduct) {
              return false;
            }

            const maximum =
              sessionProduct.product
                .maxQuantity;

            return (
              maximum !== null &&
              requiredProduct.quantity >
                maximum
            );
          },
        ),
      [
        requiredProducts,
        sessionProducts,
      ],
    );

  function updateQuantity(
    sessionProduct: PublicSessionProduct,
    change: number,
  ) {
    if (disabled) {
      return;
    }

    const product =
      sessionProduct.product;

    const requiredMinimum =
      requiredQuantityBySlug.get(
        product.slug,
      ) ?? 0;

    setQuantities(
      (current) => {
        const currentQuantity =
          current[
            sessionProduct.productId
          ] ?? 0;

        let nextQuantity =
          Math.max(
            requiredMinimum,
            currentQuantity + change,
          );

        if (
          product.maxQuantity !==
          null
        ) {
          nextQuantity =
            Math.min(
              nextQuantity,
              product.maxQuantity,
            );
        }

        return {
          ...current,
          [sessionProduct.productId]:
            nextQuantity,
        };
      },
    );
  }

  return (
    <section className="rounded-2xl border bg-card p-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Step 4
        </p>

        <h2 className="text-2xl font-semibold">
          Add-ons
        </h2>

        <p className="text-muted-foreground">
          Add any extras available
          for your selected session.
        </p>
      </div>

      {requiredProducts.length >
      0 ? (
        <div className="mt-6 rounded-xl border bg-muted/30 p-5">
          <p className="font-medium">
            Required for this booking
          </p>

          <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
            {requiredProducts.map(
              (requiredProduct) => (
                <div
                  key={
                    requiredProduct.productSlug
                  }
                >
                  <p>
                    Required quantity:{" "}
                    {
                      requiredProduct.quantity
                    }
                  </p>

                  {requiredProduct.messages.map(
                    (message) => (
                      <p
                        key={message}
                        className="mt-1"
                      >
                        {message}
                      </p>
                    ),
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-6 rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">
            Loading add-ons...
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="font-medium text-destructive">
            Unable to load add-ons
          </p>

          <p className="mt-1 text-sm text-destructive">
            {error}
          </p>
        </div>
      ) : null}

      {!isLoading &&
      !error &&
      unavailableRequiredProducts.length >
        0 ? (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="font-medium text-destructive">
            Required add-on unavailable
          </p>

          <p className="mt-1 text-sm text-destructive">
            A product required by the
            booking rules is not
            available for this session.
          </p>
        </div>
      ) : null}

      {!isLoading &&
      !error &&
      invalidMaximumRequirements.length >
        0 ? (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="font-medium text-destructive">
            Add-on configuration issue
          </p>

          <p className="mt-1 text-sm text-destructive">
            A required quantity is
            higher than the maximum
            quantity configured for this
            add-on.
          </p>
        </div>
      ) : null}

      {!isLoading &&
      !error &&
      sessionProducts.length ===
        0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-5">
          <p className="text-sm text-muted-foreground">
            There are no add-ons
            available for this
            session.
          </p>
        </div>
      ) : null}

      {!isLoading &&
      !error &&
      sessionProducts.length >
        0 ? (
        <div className="mt-6 grid gap-3">
          {sessionProducts.map(
            (sessionProduct) => {
              const product =
                sessionProduct.product;

              const quantity =
                quantities[
                  sessionProduct.productId
                ] ?? 0;

              const requiredMinimum =
                requiredQuantityBySlug.get(
                  product.slug,
                ) ?? 0;

              const isRequired =
                requiredMinimum > 0;

              const atMinimum =
                quantity <=
                requiredMinimum;

              const atMaximum =
                product.maxQuantity !==
                  null &&
                quantity >=
                  product.maxQuantity;

              return (
                <div
                  key={
                    sessionProduct.id
                  }
                  className="flex flex-col gap-4 rounded-xl border bg-background p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold">
                        {product.name}
                      </h3>

                      <span className="text-sm font-medium">
                        {formatCurrency(
                          product.price,
                        )}
                      </span>

                      {isRequired ? (
                        <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                          Required
                        </span>
                      ) : null}
                    </div>

                    {product.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {
                          product.description
                        }
                      </p>
                    ) : null}

                    {isRequired ? (
                      <p className="mt-2 text-sm font-medium">
                        Minimum required:{" "}
                        {requiredMinimum}
                      </p>
                    ) : null}

                    {product.maxQuantity !==
                    null ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Maximum{" "}
                        {
                          product.maxQuantity
                        }{" "}
                        per booking
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={
                        disabled ||
                        atMinimum
                      }
                      onClick={() =>
                        updateQuantity(
                          sessionProduct,
                          -1,
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-lg border text-lg font-medium disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Remove one ${product.name}`}
                    >
                      −
                    </button>

                    <span className="min-w-8 text-center text-lg font-semibold">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      disabled={
                        disabled ||
                        atMaximum
                      }
                      onClick={() =>
                        updateQuantity(
                          sessionProduct,
                          1,
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-lg border text-lg font-medium disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Add one ${product.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            },
          )}
        </div>
      ) : null}

      {subtotal > 0 ? (
        <div className="mt-6 flex items-center justify-between rounded-xl border bg-muted/30 p-5">
          <p className="font-medium">
            Add-ons subtotal
          </p>

          <p className="text-2xl font-semibold">
            {formatCurrency(
              subtotal,
            )}
          </p>
        </div>
      ) : null}
    </section>
  );
}