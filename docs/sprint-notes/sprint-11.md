# Sprint 11

## Objective

Establish the Event Workspace as the operational centre of Glacier and define the core product architecture for future modules.

---

## Features Completed

### Event Workspace

- Event Workspace
- Dynamic event routing
- Event Header
- Event Tabs
- Event Overview
- Sessions Timeline
- Working tab navigation

---

### Frontend Architecture

- Shared API client
- Service layer
- Hook layer
- Dynamic route structure
- Page → Hook → Service → API architecture

---

### Session Integration

- Event-specific session filtering
- Session service
- Session hook
- Timeline grouped by date
- Session loading within Event Workspace

---

### Authentication

- JWT expiry handling
- Automatic redirect to Login on expired session

---

## Architectural Decisions

Event Workspace and Event Wizard are separate experiences.

The Event Workspace is the operational hub used throughout the life of an event.

The Event Wizard is a guided onboarding workflow that reuses existing platform capabilities.

Business capabilities are implemented once and reused throughout the platform.

Frontend architecture follows:

Page

↓

Hook

↓

Service

↓

API

---

## Product Decisions

Sessions are displayed as a timeline grouped by date.

Organisers define operational patterns rather than repetitive data entry.

Operational schedules generate independent session records.

The Operational Schedule Builder will become the foundation of session creation.

---

## Sprint Outcome

The Event Workspace foundation is now complete.

The frontend architecture is considered stable and will be reused by all future platform modules.

Glacier has transitioned from infrastructure development to product capability development.

---

## Next Sprint

Sprint 12

Operational Scheduling

Sessions Workspace

Session Management

Operational Schedule Builder

Recurring Session Generation

Session Exception Editing