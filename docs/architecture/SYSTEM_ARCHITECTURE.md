# System Architecture

Project Glacier is a multi-tenant event commerce and operations platform.

## Stack
- NestJS API
- Prisma ORM
- PostgreSQL
- JWT + Passport
- bcrypt
- QR code generation

## Core model
Organisation → Users/Memberships → Events → Sessions → Products → Variants → Session Products → Bookings → Participants → Tickets.

## Security
JWT contains user ID, email, role and organisation ID. Controllers extract authenticated context and services scope queries through organisation relationships.

## Principle
The backend is authoritative for permissions, tenant scope, booking rules, capacity, ticket state and payments.
