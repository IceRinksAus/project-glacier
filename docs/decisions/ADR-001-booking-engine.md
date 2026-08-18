# ADR-001 – Booking Engine Foundation

**Status:** Accepted

**Date:** August 2026

**Sprint:** Sprint 10

---

# Context

Project Glacier is a multi-tenant SaaS ticketing platform designed for temporary events, permanent venues and future enterprise customers.

The booking engine is the core business component of the platform.

This Architecture Decision Record documents the design decisions that underpin the booking engine and reservation lifecycle.

---

# Decision

The booking engine will prioritise:

- Simplicity
- Predictability
- Performance
- Expandability
- Tenant isolation

Configuration should exist at the highest logical level possible.

Lower levels should only override behaviour where genuine business requirements exist.

---

# Booking Lifecycle

Bookings progress through the following lifecycle:

RESERVED

↓

CONFIRMED

↓

COMPLETED

or

RESERVED

↓

EXPIRED

Bookings are initially created in a RESERVED state.

Customers are provided with a configurable reservation period (currently 15 minutes).

If payment is not completed before the reservation expires, the booking automatically transitions to EXPIRED.

---

# Reservation Expiry

Reservation expiry is managed by BookingReservationService, which also coordinates cleanup of unresolved provider payments for expired bookings.

The scheduler executes every minute.

Expired reservations:

- update booking status to EXPIRED
- populate expiredAt
- automatically release held capacity

No manual intervention is required.

---

# Capacity Philosophy

Admission capacity is managed by Sessions.

Products do not manage admission capacity.

Examples:

Adult

Child

Senior

Family

Companion

All contribute towards Session capacity.

Retail products do not.

---

# Inventory Philosophy

Inventory is reserved for physical stock only.

Examples:

- Hoodies
- Gloves
- Socks
- Plush toys
- Merchandise

Admission availability is never controlled using inventory.

---

# Sales Window Hierarchy

Sales windows inherit using the following hierarchy:

Event

↓

Session

↓

Product (optional)

This minimises administration while retaining flexibility.

---

# Validation Strategy

Booking validation occurs before database writes.

Validation includes:

- Customer
- Event
- Session
- Ticket Type
- Product
- Session Product
- Quantity
- Inventory
- Sales Windows
- Rules Engine

Future validation modules can be added without changing booking creation.

---

# Consequences

Benefits include:

- Predictable behaviour
- Reduced administration
- Scalable architecture
- Easier testing
- SaaS readiness
- Clean separation of responsibilities

This ADR forms the foundation for all future booking functionality.