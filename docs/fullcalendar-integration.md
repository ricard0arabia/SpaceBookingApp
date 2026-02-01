# FullCalendar Integration Plan

## Calendar Configuration
- `timeZone: "Asia/Manila"` for authoritative display and rule alignment.
- Views: `dayGridMonth`, `timeGridWeek`, `timeGridDay`.
- Operating hours: `slotMinTime: "09:00:00"`, `slotMaxTime: "22:00:00"`.
- 1-hour increments: `slotDuration: "01:00:00"`, `snapDuration: "01:00:00"`.
- `selectable: true`, `selectMirror: true`.

## Event Sources
- `GET /api/calendar/events?start=ISO&end=ISO`
- Transform into FullCalendar events:
  - **CONFIRMED**: `display: "auto"`, class `event-confirmed`.
  - **HELD/PENDING_APPROVAL**: `display: "auto"`, class `event-tentative`.
  - **Blocks**: `display: "background"`, class `event-block`.

## Selection Behavior
- **Month view**: use `dateClick` and create a 1-hour default selection (9:00–10:00) or prompt for time.
- **Week/Day views**: use `select` with drag-to-select; ensure aligned to hours and within 9:00–22:00.

## Pending Selection Persistence
- Store selection in:
  - Pinia `useSelectionStore` (reactive UI), and
  - `sessionStorage` (OAuth redirect safety).
- On app startup / auth hydration:
  - Rehydrate selection from `sessionStorage`.
  - Re-apply selection to FullCalendar via API (`calendarApi.select`).
  - Open `ReservationModal` automatically if authenticated.

## Visual Styling
- Confirmed: solid color, high contrast.
- Tentative: dashed border or lower opacity.
- Blocks: background shading with tooltip.

## Conflict Rendering
- Client-side rendering is visual only; the backend remains authoritative for conflict checks.
