"use client";

import { DragEvent, FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ProductAdministration,
  ProductGroupAdministration,
  productSetupService,
} from "@/services/product-setup.service";

interface ProductOrganisationProps {
  eventId: string;
  groups: ProductGroupAdministration[];
  products: ProductAdministration[];
  onSaved: () => Promise<void>;
}

interface ProductBucket {
  groupId: string | null;
  name: string;
  products: ProductAdministration[];
}

export function ProductOrganisation({
  eventId,
  groups,
  products,
  onSaved,
}: ProductOrganisationProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);

  const orderedGroups = useMemo(
    () =>
      [...groups].sort(
        (left, right) =>
          left.sortOrder - right.sortOrder ||
          left.name.localeCompare(right.name),
      ),
    [groups],
  );
  const buckets = useMemo<ProductBucket[]>(
    () => [
      ...orderedGroups.map((group) => ({
        groupId: group.id,
        name: group.name,
        products: products
          .filter((product) => product.productGroupId === group.id)
          .sort(
            (left, right) =>
              left.sortOrder - right.sortOrder ||
              left.name.localeCompare(right.name),
          ),
      })),
      {
        groupId: null,
        name: "Other add-ons",
        products: products
          .filter((product) => !product.productGroupId)
          .sort(
            (left, right) =>
              left.sortOrder - right.sortOrder ||
              left.name.localeCompare(right.name),
          ),
      },
    ],
    [orderedGroups, products],
  );

  async function save(action: () => Promise<unknown>, success: string) {
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await action();
      await onSaved();
      setMessage(success);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save add-on organisation.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function orderPayload(nextBuckets: ProductBucket[]) {
    return nextBuckets.map((bucket) => ({
      groupId: bucket.groupId,
      productIds: bucket.products.map((product) => product.id),
    }));
  }

  async function createGroup(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    await save(
      () =>
        productSetupService.createGroup({
          eventId,
          name: trimmedName,
          ...(description.trim() ? { description: description.trim() } : {}),
        }),
      `${trimmedName} was created.`,
    );
    setName("");
    setDescription("");
  }

  async function moveGroup(groupId: string, change: number) {
    const currentIndex = orderedGroups.findIndex(
      (group) => group.id === groupId,
    );
    const targetIndex = currentIndex + change;
    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= orderedGroups.length
    )
      return;
    const next = [...orderedGroups];
    [next[currentIndex], next[targetIndex]] = [
      next[targetIndex],
      next[currentIndex],
    ];
    await save(
      () =>
        productSetupService.updateGroupOrder(
          eventId,
          next.map(({ id }) => id),
        ),
      "Group order saved.",
    );
  }

  async function dropGroup(targetGroupId: string) {
    if (!draggedGroupId || draggedGroupId === targetGroupId) return;
    const next = [...orderedGroups];
    const sourceIndex = next.findIndex(({ id }) => id === draggedGroupId);
    const targetIndex = next.findIndex(({ id }) => id === targetGroupId);
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDraggedGroupId(null);
    await save(
      () =>
        productSetupService.updateGroupOrder(
          eventId,
          next.map(({ id }) => id),
        ),
      "Group order saved.",
    );
  }

  async function moveProduct(
    productId: string,
    groupId: string | null,
    change: number,
  ) {
    const nextBuckets = buckets.map((bucket) => ({
      ...bucket,
      products: [...bucket.products],
    }));
    const source = nextBuckets.find((bucket) =>
      bucket.products.some((product) => product.id === productId),
    );
    const target = nextBuckets.find((bucket) => bucket.groupId === groupId);
    if (!source || !target) return;
    const sourceIndex = source.products.findIndex(
      (product) => product.id === productId,
    );
    const [product] = source.products.splice(sourceIndex, 1);
    if (source === target) {
      const targetIndex = sourceIndex + change;
      if (targetIndex < 0 || targetIndex > target.products.length) return;
      target.products.splice(targetIndex, 0, product);
    } else {
      target.products.push(product);
    }
    await save(
      () =>
        productSetupService.updateProductOrder(
          eventId,
          orderPayload(nextBuckets),
        ),
      "Product order saved.",
    );
  }

  async function dropProduct(
    targetGroupId: string | null,
    targetProductId?: string,
  ) {
    if (!draggedProductId || draggedProductId === targetProductId) return;
    const nextBuckets = buckets.map((bucket) => ({
      ...bucket,
      products: [...bucket.products],
    }));
    const source = nextBuckets.find((bucket) =>
      bucket.products.some((product) => product.id === draggedProductId),
    );
    const target = nextBuckets.find(
      (bucket) => bucket.groupId === targetGroupId,
    );
    if (!source || !target) return;
    const sourceIndex = source.products.findIndex(
      ({ id }) => id === draggedProductId,
    );
    const [product] = source.products.splice(sourceIndex, 1);
    const targetIndex = targetProductId
      ? target.products.findIndex(({ id }) => id === targetProductId)
      : target.products.length;
    target.products.splice(
      targetIndex < 0 ? target.products.length : targetIndex,
      0,
      product,
    );
    setDraggedProductId(null);
    await save(
      () =>
        productSetupService.updateProductOrder(
          eventId,
          orderPayload(nextBuckets),
        ),
      "Product order saved.",
    );
  }

  function allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  return (
    <section className="rounded-xl border bg-card p-6 xl:col-span-2">
      <p className="text-sm font-medium text-muted-foreground">
        Customer presentation
      </p>
      <h2 className="mt-2 text-2xl font-semibold">Add-on groups and order</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Arrange the headings and Product sequence customers see. This does not
        change rules, Session capacity or inventory.
      </p>

      <form
        onSubmit={createGroup}
        className="mt-5 grid gap-3 md:grid-cols-[1fr_1.5fr_auto]"
      >
        <label className="text-sm font-medium">
          Group name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"
            placeholder="Merchandise"
          />
        </label>
        <label className="text-sm font-medium">
          Description
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"
            placeholder="Optional customer-facing explanation"
          />
        </label>
        <Button
          type="submit"
          disabled={isSaving || !name.trim()}
          className="md:mt-7"
        >
          Add group
        </Button>
      </form>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="mt-4 text-sm font-medium">
          {message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {buckets.map((bucket, bucketIndex) => (
          <article
            key={bucket.groupId ?? "ungrouped"}
            draggable={Boolean(bucket.groupId)}
            onDragStart={() =>
              bucket.groupId && setDraggedGroupId(bucket.groupId)
            }
            onDragOver={allowDrop}
            onDrop={() => {
              if (draggedProductId) void dropProduct(bucket.groupId);
              else if (bucket.groupId) void dropGroup(bucket.groupId);
            }}
            className="rounded-xl border p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{bucket.name}</h3>
              {bucket.groupId ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSaving || bucketIndex === 0}
                    onClick={() => void moveGroup(bucket.groupId!, -1)}
                    aria-label={`Move ${bucket.name} up`}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      isSaving || bucketIndex === orderedGroups.length - 1
                    }
                    onClick={() => void moveGroup(bucket.groupId!, 1)}
                    aria-label={`Move ${bucket.name} down`}
                  >
                    ↓
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="mt-3 space-y-2">
              {bucket.products.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No Products in this group.
                </p>
              ) : null}
              {bucket.products.map((product, productIndex) => (
                <div
                  key={product.id}
                  draggable
                  onDragStart={(event) => {
                    event.stopPropagation();
                    setDraggedGroupId(null);
                    setDraggedProductId(product.id);
                  }}
                  onDragOver={allowDrop}
                  onDrop={(event) => {
                    event.stopPropagation();
                    void dropProduct(bucket.groupId, product.id);
                  }}
                  className="rounded-lg border bg-background p-3"
                >
                  <p className="font-medium">{product.name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <label className="text-xs font-medium">
                      Group
                      <select
                        value={bucket.groupId ?? ""}
                        disabled={isSaving}
                        onChange={(event) =>
                          void moveProduct(
                            product.id,
                            event.target.value || null,
                            0,
                          )
                        }
                        className="ml-2 h-8 rounded-md border bg-background px-2 font-normal"
                      >
                        {orderedGroups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                        <option value="">Other add-ons</option>
                      </select>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSaving || productIndex === 0}
                      onClick={() =>
                        void moveProduct(product.id, bucket.groupId, -1)
                      }
                      aria-label={`Move ${product.name} up`}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        isSaving || productIndex === bucket.products.length - 1
                      }
                      onClick={() =>
                        void moveProduct(product.id, bucket.groupId, 1)
                      }
                      aria-label={`Move ${product.name} down`}
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
