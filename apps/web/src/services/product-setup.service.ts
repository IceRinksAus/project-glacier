import { api } from "@/lib/api";

export interface ProductVariantAdministration {
  id: string;
  productId: string;
  name: string;
  slug: string;
  priceOverride: string | number | null;
  status: string;
  inventoryTracked: boolean;
  inventoryQuantity: number | null;
  availableOnline: boolean;
}

export interface SessionProductAdministration {
  id: string;
  sessionId: string;
  productId: string;
  active: boolean;
  capacityOverride: number | null;
  session?: {
    id: string;
    name: string;
  };
}

export interface ProductAdministration {
  id: string;
  eventId: string;
  name: string;
  slug: string;
  description: string | null;
  productType: string;
  price: string | number;
  status: string;
  inventoryTracked: boolean;
  inventoryQuantity: number | null;
  capacityControlled: boolean;
  capacity: number | null;
  requiresSession: boolean;
  availableOnline: boolean;
  availablePos: boolean;
  sortOrder: number;
  productGroupId: string | null;
  variants: ProductVariantAdministration[];
  sessionProducts: SessionProductAdministration[];
}

export interface ProductGroupAdministration {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  products: ProductAdministration[];
}

export interface CreateProductAdministration {
  eventId: string;
  name: string;
  slug: string;
  description?: string;
  productType: "ADD_ON";
  price: number;
  gstRate: number;
  inventoryTracked: boolean;
  capacityControlled: boolean;
  capacity?: number;
  requiresSession: boolean;
  availableOnline: boolean;
  availablePos: boolean;
  minQuantity: number;
}

export interface CreateVariantAdministration {
  productId: string;
  name: string;
  slug: string;
  priceOverride?: number;
  status: "ACTIVE";
  inventoryTracked: true;
  inventoryQuantity: number;
  availableOnline: true;
  availablePos: true;
  sortOrder: number;
}

export interface CreateRequirementRule {
  eventId: string;
  name: string;
  slug: string;
  description: string;
  ruleType: "PRODUCT_REQUIREMENT";
  scope: "PARTICIPANT";
  status: "ACTIVE";
  priority: number;
  conditions: {
    all: Array<{
      field: "ticketTypeId";
      operator: "IN";
      value: string[];
    }>;
  };
  actions: {
    type: "REQUIRE_PRODUCT";
    productSlug: string;
    quantityPerMatchingItem: 1;
  };
  message: string;
  stopProcessing: false;
}

export const productSetupService = {
  findForEvent: (eventId: string) =>
    api.get<ProductAdministration[]>(
      `/product?eventId=${encodeURIComponent(eventId)}`,
    ),

  createProduct: (data: CreateProductAdministration) =>
    api.post<ProductAdministration>("/product", data),

  createVariant: (data: CreateVariantAdministration) =>
    api.post<ProductVariantAdministration>("/product-variant", data),

  assignToSession: (sessionId: string, productId: string) =>
    api.post<SessionProductAdministration>("/session-product", {
      sessionId,
      productId,
      active: true,
    }),

  createRequirementRule: (data: CreateRequirementRule) =>
    api.post("/rule", data),

  updateStatus: (
    productId: string,
    status: "DRAFT" | "ACTIVE" | "INACTIVE",
  ) =>
    api.patch<ProductAdministration>(`/product/${productId}/status`, {
      status,
    }),

  findGroups: (eventId: string) =>
    api.get<ProductGroupAdministration[]>(
      `/product-group?eventId=${encodeURIComponent(eventId)}`,
    ),

  createGroup: (data: {
    eventId: string;
    name: string;
    description?: string;
  }) => api.post<ProductGroupAdministration>("/product-group", data),

  updateGroupOrder: (eventId: string, groupIds: string[]) =>
    api.patch<ProductGroupAdministration[]>("/product-group/order", {
      eventId,
      groupIds,
    }),

  updateProductOrder: (
    eventId: string,
    groups: Array<{ groupId: string | null; productIds: string[] }>,
  ) => api.patch<ProductGroupAdministration[]>("/product-group/product-order", {
    eventId,
    groups,
  }),
};
