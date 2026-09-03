# Security and Privacy Findings Register

## Status

Sprint 32 working register. This is a repository and local-configuration review, not an independent penetration test, legal opinion or production security certification.

## Severity and closure rules

| Severity | Meaning                                                                                                         | Closure rule                                                                             |
| -------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Critical | Credible immediate compromise, cross-tenant exposure, secret disclosure or unsafe financial/admission authority | Must be resolved before Sprint close and before any exposed environment                  |
| High     | Material security/privacy control failure with a realistic exploitation or exposure path                        | Must be resolved or explicitly blocked from exposure with named owner and near-term date |
| Medium   | Defence, operational evidence or privacy weakness requiring planned correction                                  | May remain only with owner, due date and bounded exposure                                |
| Low      | Hardening or documentation improvement                                                                          | Track to normal completion                                                               |
| Pending  | Evidence has not yet been collected, so severity cannot responsibly be assigned                                 | Complete the stated evidence action before the applicable gate                           |

## Findings

| ID         | Area                           | Severity | Finding and disposition                                                                                                                                                                                                                                                                             | Owner                                                             | Due/gate                                                          | Status/evidence                                                                                              |
| ---------- | ------------------------------ | -------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| SEC-31-001 | Current tracked secrets        |      Low | Git-tracked files require repeatable credential-pattern scanning. Added `npm run verify:secrets`; it reports only file, line and rule, never the matched value.                                                                                                                                     | Development owner                                                 | Every release                                                     | Resolved locally; current scan evidence is retained with each release                                        |
| SEC-31-002 | Dependency vulnerabilities     |     High | API audit reports GHSA-ggr8-5vv4-36mx through Prisma's configuration loader. Recursive attacker-controlled object graphs are not accepted through that path, but no compatible upstream fix is available. Do not force a major transitive override.                                                 | Development owner                                                 | Recheck weekly and before any internet exposure                   | Open and bounded; web audit has zero findings; production exposure remains prohibited                        |
| SEC-31-003 | Deployment-edge abuse controls |     High | A tested per-instance API safety limit now covers login and high-risk public routes, but coordinated edge enforcement, trusted-proxy topology and alert delivery cannot be proven locally and are not deployed.                                                                                     | Future infrastructure owner                                       | Before internet exposure                                          | Open; local defence-in-depth complete, exposure prohibited by ADR-007 and checklist                          |
| SEC-31-004 | Privileged MFA and recovery    |     High | Persisted eight-hour sessions and immediate current/all-session revocation are implemented. OWNER/MANAGER MFA and secure password recovery/email delivery remain unimplemented.                                                                                                                     | Product and security owner                                        | Before live operator access                                       | Partially resolved; MFA/recovery still block production activation                                           |
| SEC-31-005 | Central logs and alerts        |   Medium | Correlated privacy-safe local evidence exists, but external retention, uptime/error monitoring and alert delivery are not configured.                                                                                                                                                               | Future operations owner                                           | Before funded staging acceptance                                  | Deferred under no-material-spend gate                                                                        |
| SEC-31-006 | Independent security review    |  Pending | No independent penetration test or external security review has occurred.                                                                                                                                                                                                                           | Organiser                                                         | Before live pilot                                                 | Deferred expenditure, explicitly not waived                                                                  |
| SEC-31-007 | Branding file boundary         |      Low | Existing tenant/public selection controls were retained; upload-size consistency, image structure, safe names, constrained local keys and replacement-object cleanup required hardening. Managed malware scanning/re-encoding remains pre-live.                                                     | Development/infrastructure                                        | Local controls now; managed controls pre-live                     | Local hardening resolved; managed storage controls remain explicitly open                                    |
| SEC-31-008 | Privacy data lifecycle         |     High | The actual data flow and current deletion behaviour are now registered, but no legally approved retention schedule, privacy-request/anonymisation workflow, legal hold or deployed log/object/backup lifecycle exists. Customer, participant and Waiver identity currently has no automatic expiry. | Product/privacy owner with legal, accounting and insurer advisers | Before representative staging data or live operation              | Engineering register complete; production activation remains prohibited pending approval and implementation  |
| SEC-31-009 | Ticket credential at rest      |   Medium | Sprint 32 replaced stored bearer values with a random selector, recorded key ID and HMAC-SHA-256 authority held outside PostgreSQL. Existing local credentials are accepted only through one-way hashes; raw values were cleared and a database constraint prohibits reintroduction. OWNER/assigned-MANAGER rotation immediately replaces the selector/key reference, clears legacy acceptance and records non-secret audit evidence. | Development/security owner | Implement before live Ticket use | **Closed locally 3 September 2026**; 47 migrations, 622 API tests, 88 web tests, production builds and tenant/role isolation passed. Managed production key custody and independent review remain separate pre-live evidence. |

## Current gate statement

No unresolved Critical finding is currently known from the completed local evidence. That statement is deliberately bounded: items marked Pending have not been assessed, and open High findings prohibit internet/live exposure rather than being accepted as safe. Dependency evidence and the SEC-31-002 reachability assessment are recorded in `DEPENDENCY_AUDIT_2026-09-01.md`.

The privacy inventory, provisional disposition and unresolved approval gates are
recorded in `../privacy/PRIVACY_DATA_FLOW_RETENTION_AND_DELETION_REGISTER.md`.
The register intentionally contains no claimed statutory period: numeric
retention, privacy notices, legal hold and customer-rights handling require
qualified approval and tested implementation before representative or live
personal data is introduced.

## Secret scanning boundary

The local scanner checks the current Git-tracked tree for selected high-confidence credential forms:

- private-key headers;
- AWS access keys;
- GitHub access tokens;
- OpenAI API keys;
- Stripe live/restricted keys and webhook secrets; and
- PostgreSQL URLs containing credentials.

It intentionally excludes ignored local environment files, binary files and its own detection expressions. A pass does not prove that no secret exists in Git history, in an untracked file, in a novel provider format or encoded inside another value. Before internet exposure, Glacier still requires a reviewed historical-secret scan and provider-side credential inventory/rotation.

An intentional non-secret fixture may suppress only the immediately following line with `secret-scan: allow-next-line -- <reason>`. The marker must state why the value is safe. File-wide exclusions and unexplained suppressions are prohibited.

## Handling a finding

1. Do not paste the matched value into chat, tickets, commits or documentation.
2. Identify whether the credential is real and which environment/provider it affects.
3. Revoke or rotate a real credential before cleaning repository history.
4. Preserve a non-secret incident record with owner, timestamps, affected scope and action.
5. Use a reviewed history-rewrite procedure only after backups and collaborator coordination.
6. Rerun the scanner and confirm provider-side revocation; deleting a line alone does not invalidate a leaked credential.
