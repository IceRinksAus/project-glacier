# Frontend Architecture

## Philosophy

Pages orchestrate.

Components render.

Hooks retrieve data.

Services communicate with the API.

The API client performs HTTP requests.

---

## Standard Flow

Page

↓

Hook

↓

Service

↓

API Client

↓

Nest API

---

## Folder Structure

app/

components/

hooks/

services/

lib/

---

## Rules

Pages never call the API directly.

Components never fetch data.

Hooks never render UI.

Services contain business API calls.

The API client contains HTTP implementation.