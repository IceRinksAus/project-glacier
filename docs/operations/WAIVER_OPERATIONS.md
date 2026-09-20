# Waiver Operations

## Template authority

Waiver templates are controlled by activity, Australian jurisdiction and revision. An OWNER may create an Organisation draft, but it cannot generate an Event Waiver until the OWNER records an external legal or organisational approval reference and approves it. Approval retires the formerly approved Organisation revision for the same activity and jurisdiction. Platform-curated wording, if present, is an explicit fallback rather than another tenant's content.

The historical NSW 2026, WA 2026, VIC 2025 and SA 2024 CleverWaiver forms supplied for review remain source references only. NSW combines ticket/refund/admission, rink, risk and media concepts; WA and VIC use similar structure with different legislation; SA contains older operator/year details and unresolved prescribed-form choices. Do not copy any of them into `APPROVED` status without current entity, insurer, privacy and jurisdiction review.

## Event preparation

1. Set the Event activity and jurisdiction.
2. Confirm a compatible approved template exists in **Waivers**.
3. Open the Event **Waiver** tab, generate a draft and review every substitution.
4. Publish only the reviewed immutable version.
5. Download and display the stable Event QR at POS and skate hire.

Operational age, helmet, accompaniment and alcohol rules are Event policy unless qualified advice determines otherwise. Do not silently treat a rule copied from an old form as state law.

## Customer completion

Booking confirmation opens the Waiver with bounded Booking possession authority in the browser fragment. The customer explicitly chooses the participating adult and each dependant. A general Event QR creates valid independent evidence without a Booking. Optional media and marketing choices are separate from mandatory risk acceptance.

The completion proof contains a high-entropy verification URL/QR, Event, version, acceptance time and covered-person count. It excludes names, signature and child details. Only the SHA-256 credential hash is stored. The customer may use browser Print / Save PDF; native Wallet passes are not yet supported.

## Staff matching and lookup

POS Ticket or Booking lookup shows **Waiver complete** or **Waiver not linked** for each participant. This is an operational warning only: it never changes Ticket validity, consumes a Ticket or grants admission.

For an independent submission, an assigned OWNER or MANAGER may open the Event Waiver evidence, enter the confirmed Booking number, inspect that Booking's participants and select exact matches. Never match on a similar name alone. Glacier replaces the selected links and records the operator, Event, Booking, submission, participant identifiers and time without copying signature or full wording into the audit record.

SCANNER users must not receive full submission evidence, child dates of birth or template controls. Escalate disputed identity, guardian authority, legal wording or correction requests to the named Event manager.

## Deferred production evidence

Before live use, obtain qualified template/consent/retention approval, approved privacy notices and legal-hold handling; configure managed secrets, edge abuse controls, monitoring and backups; validate representative phones, tablets and deployed scanner/POS hardware; and complete independent privacy, accessibility, legal and security review.
