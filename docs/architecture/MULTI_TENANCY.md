# Multi-Tenancy

## Decision
Protected operations derive organisation context from the JWT, never from client-supplied `organizationId`.

## Implemented scope
- Events
- Sessions
- Products
- Product variants
- Session products

## Relationship scoping examples
- Variant → Product → Event → Organisation
- Session Product → Session → Event → Organisation
- Session Product → Product → Event → Organisation

This prevents cross-tenant access by changing request identifiers.
