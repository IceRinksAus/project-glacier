# Sprint 43 Organisation Reports — Organiser Walkthrough

Use fictional local data only. Sign in as an OWNER first, then repeat the
assignment check as a MANAGER restricted to one Event.

## 1. Reports home

1. Open **Reports** from the main sidebar.
2. Confirm the Organisation headline appears before the report library.
3. Confirm the six working reports say **Available** and unfinished reports say
   **Coming soon** and cannot be opened.

## 2. One and multiple Events

1. Open **Sales Summary**.
2. Clear the Event checklist and select one Event.
3. Generate the report and confirm the result replaces the setup screen.
4. Choose **Change report settings**, select two or more Events and regenerate.
5. Refresh the browser. Confirm the report, selected Events and result state
   remain intact.

## 3. Event Group and date range

1. Return to setup and select an Event Group shortcut.
2. Confirm it populates the visible Event checklist.
3. Apply a From/To range containing known fictional transactions.
4. Confirm the result states that dates are evaluated in each Event timezone.
5. Try only one date or a reversed range and confirm the report is rejected with
   a useful explanation.

## 4. Report reconciliation

For the same Event selection and range, open each available report and compare
its headline figures with its rows:

- Sales Summary: Bookings, gross, refunds, net and average Booking;
- Ticket Types: units, allocated refunds, net Ticket sales and admissions;
- Sessions: Ticket units, net collection, weighted capacity and remaining places;
- Event Dates: local dates, Sessions, Ticket units, collection and capacity;
- Products: units, Product sales, attach rate and tracked/not-tracked inventory;
- Booking Pace: confirmed historical Bookings and Tickets by lead-time bucket.

Confirm a range with no matching rows shows a clear no-data message.

## 5. Evidence outputs

1. Choose **Download CSV** on at least Sales Summary and one detailed report.
2. Confirm the file contains only the selected Events, chosen range, Event
   timezone, generated time and the same exact row values shown on screen.
3. Choose **Print / Save PDF** and confirm setup controls and the Reports
   catalogue are absent from the printed result.

## 6. Assignment boundary

1. Sign in as a MANAGER assigned to one Event.
2. Confirm only that Event can be selected and exported.
3. Do not use or retain real customer, participant or payment-provider data in
   acceptance evidence.

Record discrepancies against the metric definitions in
`docs/architecture/REPORTING.md`. New report ideas belong in later scope unless
they expose a security, privacy or calculation defect.
