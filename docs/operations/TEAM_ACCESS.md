# Team and Access Operating Guide

## Purpose

Team and Access lets an Organisation OWNER give each operator the minimum access needed for their work. It separates role — what the person may do — from Event scope — where they may do it.

## Pilot roles

| Role | Intended use | Event scope | Governance |
| --- | --- | --- | --- |
| OWNER | Organisation owner and security authority | Always all Events | May manage Team access and OWNER-only configuration |
| MANAGER | Site/Event operational manager | All or selected Events | Cannot manage Team access or inherit OWNER-only mutations automatically |
| STAFF | Ticket desk, POS-ready and operational support | All or selected Events | No Team or Organisation governance |
| SCANNER | Dedicated gate account/device | Selected Events only | Scanner lookup and admission only |

There is no active MEMBER role. Legacy MEMBER records migrate to STAFF with all-Event scope.

## Changing access

1. Sign in as the Organisation OWNER.
2. Open **Settings → Team and Access**.
3. Find the person by name and email.
4. Select Manager, Staff or Scanner.
5. For Manager or Staff, choose all Events or selected Events.
6. For selected Events, tick every Event the person requires. An empty selection means no Event access.
7. Select **Save access** and confirm the saved message.
8. Verify the person can open an assigned Event and cannot directly open an unassigned Event.

Scanner automatically uses selected-Event scope. OWNER access is displayed read-only and cannot be changed in the ordinary Team interface.

## Access reduction and incident response

Removing an Event assignment or changing a role takes effect on the next protected request, even if the person still holds an unexpired login token. Deactivating the underlying User also prevents access through current-membership validation.

For suspected account misuse:

1. remove unnecessary Event assignments or deactivate the User through an approved administrative path;
2. do not share, reset or inspect password hashes manually;
3. retain the Organisation, person, time and reason in the operational incident record; and
4. review the access audit evidence without copying credentials or unrelated customer data.

## Owner protection and recovery

Glacier refuses to demote the final OWNER. Ordinary Team management also cannot promote another person to OWNER. Ownership transfer/recovery is intentionally a separate high-assurance procedure and must not be worked around by direct database edits.

If the only OWNER loses access, use the approved support/recovery process once established. Until that production process exists, pilot operation must confirm OWNER access before an Event and retain an authorised escalation contact.

## Audit evidence

Every successful Team membership or access update records:

- authenticated Organisation;
- acting User;
- affected User;
- action type;
- previous role, scope and Event IDs where applicable;
- resulting role, scope and Event IDs; and
- server timestamp.

The audit is append-only application evidence. It excludes passwords, JWTs and unrelated personal or customer information.

## Operational checks before an Event

- confirm at least one OWNER can sign in;
- confirm Managers can see only their operational Events;
- confirm Staff have the Events required for ticket-desk or POS-ready work;
- confirm every Scanner account has the correct Event explicitly selected;
- test one assigned and one unassigned direct Event route for restricted roles; and
- never use production customer records merely to test access control.
