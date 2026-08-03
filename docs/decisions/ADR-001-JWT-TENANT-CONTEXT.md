# ADR-001 — Tenant Context from JWT

## Status
Accepted

## Decision
Organisation context for protected operations comes from the authenticated JWT.

## Reason
Client-supplied organisation IDs create cross-tenant risk.

## Consequence
All protected services must scope reads and writes through organisation relationships.
