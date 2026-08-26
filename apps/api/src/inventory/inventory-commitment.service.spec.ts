import { InventoryCommitmentService } from './inventory-commitment.service';

describe('InventoryCommitmentService', () => {
  const client = {
    bookingProduct: { aggregate: jest.fn() },
    retailSaleItem: { aggregate: jest.fn() },
  };
  const service = new InventoryCommitmentService();

  beforeEach(() => jest.clearAllMocks());

  it('combines admission Booking and Retail Sale Product commitments', async () => {
    client.bookingProduct.aggregate.mockResolvedValue({
      _sum: { quantity: 4 },
    });
    client.retailSaleItem.aggregate.mockResolvedValue({
      _sum: { quantity: 3 },
    });

    await expect(
      service.productCommitted(client as never, 'product-1'),
    ).resolves.toBe(7);
    expect(client.retailSaleItem.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ productId: 'product-1' }),
      }),
    );
  });

  it('can exclude the current Retail Sale during completion revalidation', async () => {
    client.bookingProduct.aggregate.mockResolvedValue({
      _sum: { quantity: 0 },
    });
    client.retailSaleItem.aggregate.mockResolvedValue({
      _sum: { quantity: 2 },
    });

    await service.variantCommitted(client as never, 'variant-1', 'sale-1');

    expect(client.retailSaleItem.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          productVariantId: 'variant-1',
          retailSaleId: { not: 'sale-1' },
        }),
      }),
    );
  });
});
