-- Dedicated reasons keep paid-entitlement use distinct from discretionary
-- customer-service actions in the existing mutation ledgers.
ALTER TYPE "TicketAdjustmentReason" ADD VALUE 'FLEXIBLE_TICKET';
ALTER TYPE "BookingRescheduleReason" ADD VALUE 'FLEXIBLE_TICKET';
