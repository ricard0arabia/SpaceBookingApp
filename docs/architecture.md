# Architecture & Sequence Diagrams

## System Overview
- **Frontend**: Vue 3 CSR + TypeScript + Pinia + Vue Router + FullCalendar.
- **Backend**: Node.js + Express.js (TypeScript) with MVC structure.
- **Database**: Microsoft SQL Server via `tedious`.
- **Auth**: Google OAuth (Passport) + Phone OTP (signup required).
- **Payments**: PayMongo Checkout + webhook confirmation.
- **Timezone**: Asia/Manila authoritative for rules and UI.

## Sequence Diagrams (Mermaid)

### 1) Guest Select -> Login -> Reservation Modal
```mermaid
sequenceDiagram
  autonumber
  participant G as Guest (Browser)
  participant SPA as Vue SPA
  participant API as Express API
  participant Auth as Google/OTP Provider

  G->>SPA: Select date/time on FullCalendar
  SPA->>SPA: Store pendingSelection in Pinia + sessionStorage
  SPA->>G: Prompt login (modal or /login)
  G->>SPA: Choose Google OAuth or OTP
  alt Google OAuth
    SPA->>API: GET /auth/google
    API->>Auth: Redirect to Google
    Auth->>API: Callback /auth/google/callback
    API->>API: Create/find user + session
    API->>SPA: Redirect back to SPA
  else OTP
    G->>SPA: Enter phone + OTP (signup or login)
    SPA->>API: POST /auth/otp/*
    API->>API: Verify OTP + create session
    API->>SPA: 200 OK
  end
  SPA->>API: GET /api/me
  API->>SPA: Authenticated user
  SPA->>SPA: Re-apply pendingSelection to FullCalendar
  SPA->>G: Open Reservation Modal with selected range
```

### 2) Short Booking Pay Flow (1–2 hours)
```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant SPA as Vue SPA
  participant API as Express API
  participant DB as SQL Server
  participant Pay as PayMongo

  C->>SPA: Confirm booking (short)
  SPA->>API: POST /api/bookings
  API->>DB: Validate rules + conflicts + active booking
  API->>DB: Create booking (HELD) + slots + holdExpiresAt
  API->>Pay: Create Checkout Session
  API->>DB: Update booking -> PENDING_PAYMENT
  API->>SPA: checkoutUrl
  SPA->>Pay: Redirect to PayMongo checkout
  Pay->>API: Webhook checkout_session.payment.paid
  API->>DB: Idempotent payment + booking -> CONFIRMED
  API->>SPA: (optional) Notify via polling
```

### 3) Long Booking Approval -> Pay Flow (>=3 hours or whole-day)
```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant SPA as Vue SPA
  participant API as Express API
  participant DB as SQL Server
  participant A as Admin
  participant Pay as PayMongo

  C->>SPA: Submit for approval
  SPA->>API: POST /api/bookings
  API->>DB: Validate rules + conflicts + active booking
  API->>DB: Create booking PENDING_APPROVAL + slots
  A->>SPA: Admin approves in /admin/approvals
  SPA->>API: POST /api/admin/bookings/:id/approve
  API->>DB: Booking -> APPROVED_AWAITING_PAYMENT
  C->>SPA: Click Pay Now
  SPA->>API: POST /api/bookings/:id/pay
  API->>Pay: Create Checkout Session
  API->>DB: Booking -> PENDING_PAYMENT + holdExpiresAt
  Pay->>API: Webhook paid
  API->>DB: Booking -> CONFIRMED
```

### 4) Cancel Confirmed (Refund) Flow
```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant SPA as Vue SPA
  participant API as Express API
  participant DB as SQL Server
  participant Pay as PayMongo

  C->>SPA: Request cancel
  SPA->>API: POST /api/bookings/:id/cancel
  API->>DB: Check StartAt - now > 24h
  API->>Pay: Create Refund
  Pay->>API: Refund webhook
  API->>DB: Booking -> CANCELLED, payment -> REFUNDED
```

### 5) Reschedule Confirmed (Delta Payment/Refund) Flow
```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant SPA as Vue SPA
  participant API as Express API
  participant DB as SQL Server
  participant Pay as PayMongo
  participant A as Admin

  C->>SPA: Request reschedule
  SPA->>API: POST /api/bookings/:id/reschedule-request
  API->>DB: Create BookingChangeRequest (PENDING)
  API->>DB: Hold new slots (SLA)
  alt Requires approval
    A->>SPA: Approve request
    SPA->>API: Admin approves
    API->>DB: ChangeRequest -> PENDING_PAYMENT or FINALIZED
  end
  alt Delta > 0
    API->>Pay: Create Checkout session for delta
    Pay->>API: Webhook paid
    API->>DB: Finalize swap (transaction)
  else Delta < 0
    API->>Pay: Create Refund
    Pay->>API: Refund webhook
    API->>DB: Finalize swap (transaction)
  else Delta = 0
    API->>DB: Finalize swap (transaction)
  end
```
