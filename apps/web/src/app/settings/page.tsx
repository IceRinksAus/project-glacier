"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ShieldCheck, UserRoundCog } from "lucide-react";
import Link from "next/link";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { OrganizationFlexibleTicketSettings } from "@/components/flexible-ticket/FlexibleTicketPolicySettings";
import { Button } from "@/components/ui/button";
import { AccountSecurityPanel } from "@/components/security/AccountSecurityPanel";
import {
  getAuthRoleSnapshot,
  getServerAuthRoleSnapshot,
  subscribeAuthSession,
} from "@/lib/auth";
import { eventService, type GlacierEvent } from "@/services/event.service";
import {
  teamAccessService,
  type OrganizationAccessScope,
  type OrganizationRole,
  type TeamMember,
  type UpdateTeamAccess,
} from "@/services/team-access.service";
import { mfaSecurityService } from "@/services/mfa-security.service";

const roleDescriptions: Record<OrganizationRole, string> = {
  OWNER: "Full organisation governance and access to every Event.",
  MANAGER: "Trusted operational oversight within the assigned Event scope.",
  STAFF: "Day-to-day operational access without governance authority.",
  SCANNER: "Scanner-only access for explicitly assigned Events.",
};

export default function SettingsPage() {
  const role = useSyncExternalStore(
    subscribeAuthSession,
    getAuthRoleSnapshot,
    getServerAuthRoleSnapshot,
  );
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [events, setEvents] = useState<GlacierEvent[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  async function reload() {
    const [nextMembers, nextEvents] = await Promise.all([
      teamAccessService.getTeam(),
      eventService.getEvents(),
    ]);
    setMembers(nextMembers);
    setEvents(nextEvents);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      role === "OWNER" ? teamAccessService.getTeam() : Promise.resolve([]),
      eventService.getEvents(),
    ])
      .then(([nextMembers, nextEvents]) => {
        if (!cancelled) {
          setMembers(nextMembers);
          setEvents(nextEvents);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load Team access.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setHasLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  return (
    <PlatformShell>
      <div className="space-y-8">
        <header>
          <p className="text-sm font-medium text-muted-foreground">Settings</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Glacier settings
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Manage personal security, Organisation governance and configuration
            for the Events you are authorised to operate.
          </p>
        </header>

        <nav aria-label="Settings sections" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["#my-security", "My account and security", "Personal setting", "MFA, recovery codes and active-session protection."],
            ["#team-access", "Team and access", "Organisation setting", "Roles and Event assignments managed by the Owner."],
            ["#organisation-policies", "Organisation policies", "Organisation setting", "Default Flexible Ticket governance and future policies."],
            ["#event-configuration", "Event configuration", "Event setting", "Open configuration for an authorised Event."],
          ].map(([href, title, scope, description]) => (
            <a key={href} href={href} className="rounded-2xl border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
              <span className="text-xs font-bold uppercase tracking-wide text-primary">{scope}</span>
              <h2 className="mt-2 font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </a>
          ))}
        </nav>

        <section id="my-security" className="scroll-mt-6 space-y-4">
          <SectionHeading scope="Personal setting" title="My account and security" description="These controls apply to your own signed-in membership." />
          <AccountSecurityPanel />
        </section>

        <section id="organisation-policies" className="scroll-mt-6 space-y-4">
          <SectionHeading scope="Organisation setting" title="Organisation policies" description="Defaults apply across the Organisation unless an Event has an approved override." />
          {role === "OWNER" ? (
            <OrganizationFlexibleTicketSettings />
          ) : (
            <StateCard>Only the organisation Owner can change Organisation-wide policies.</StateCard>
          )}
        </section>

        <section id="event-configuration" className="scroll-mt-6 space-y-4">
          <SectionHeading scope="Event setting" title="Event configuration" description="Open the grouped settings workspace for an Event in your current access scope." />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}?tab=Settings`} className="rounded-xl border bg-card p-4 shadow-sm transition hover:border-primary/40">
                <p className="font-semibold">{event.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{event.status} · Open Event settings</p>
              </Link>
            ))}
          </div>
        </section>

        <section id="team-access" className="scroll-mt-6 space-y-4">
        <SectionHeading scope="Organisation setting" title="Team and access" description="Decide what each person can do and which Events they can access." />
        <RoleGuide />
        {role !== "OWNER" ? (
          <StateCard>
            Only the organisation Owner can change team access. Your current
            role is <strong>{role ?? "not available"}</strong>.
          </StateCard>
        ) : null}
        {role === "OWNER" && !hasLoaded ? (
          <StateCard>Loading Team access…</StateCard>
        ) : null}
        {error ? <StateCard error>{error}</StateCard> : null}

        {role === "OWNER" && hasLoaded && !error ? (
          <section aria-labelledby="team-members-heading" className="space-y-4">
            <div>
              <h2 id="team-members-heading" className="text-xl font-semibold">
                Team members
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Owners remain organisation-wide. Scanner accounts always require
                explicit Event assignments.
              </p>
            </div>
            {members.map((member) => (
              <MemberAccessCard
                key={member.id}
                member={member}
                events={events}
                onSaved={reload}
              />
            ))}
          </section>
        ) : null}
        </section>
      </div>
    </PlatformShell>
  );
}

function SectionHeading({ scope, title, description }: { scope: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-primary">{scope}</p>
      <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function RoleGuide() {
  return (
    <section
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Role guide"
    >
      {(Object.keys(roleDescriptions) as OrganizationRole[]).map((role) => (
        <div key={role} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            <h2 className="font-semibold">{roleLabel(role)}</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {roleDescriptions[role]}
          </p>
        </div>
      ))}
    </section>
  );
}

function MemberAccessCard({
  member,
  events,
  onSaved,
}: {
  member: TeamMember;
  events: GlacierEvent[];
  onSaved: () => Promise<void>;
}) {
  const isOwner = member.role === "OWNER";
  const [draftRole, setDraftRole] = useState<UpdateTeamAccess["role"]>(
    member.role === "OWNER" ? "MANAGER" : member.role,
  );
  const [scope, setScope] = useState<OrganizationAccessScope>(
    member.accessScope,
  );
  const [eventIds, setEventIds] = useState(
    member.user.eventAccess.map(({ event }) => event.id),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [resetReason, setResetReason] = useState("");

  function changeRole(nextRole: UpdateTeamAccess["role"]) {
    setDraftRole(nextRole);
    if (nextRole === "SCANNER") setScope("ASSIGNED_EVENTS");
  }

  function changeScope(nextScope: OrganizationAccessScope) {
    setScope(nextScope);
    if (nextScope === "ALL_EVENTS") setEventIds([]);
  }

  function toggleEvent(eventId: string) {
    setEventIds((current) =>
      current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId],
    );
  }

  async function save() {
    setIsSaving(true);
    setMessage("");
    try {
      await teamAccessService.updateAccess(member.user.id, {
        role: draftRole,
        accessScope: scope,
        eventIds: scope === "ASSIGNED_EVENTS" ? eventIds : [],
      });
      setMessage("Access saved.");
      await onSaved();
    } catch (requestError) {
      setMessage(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save access.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function resetManagerMfa() {
    if (resetReason.trim().length < 3) {
      setMessage("Enter a short reason before resetting MFA.");
      return;
    }
    setIsSaving(true);
    setMessage("");
    try {
      await mfaSecurityService.resetManager(member.user.id, resetReason);
      setResetReason("");
      setMessage("Manager MFA reset. Their sessions were revoked and they must enrol again.");
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : "Unable to reset Manager MFA.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <UserRoundCog className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold">{member.user.name}</h3>
            <p className="truncate text-sm text-muted-foreground">
              {member.user.email}
            </p>
          </div>
        </div>
        <span className="w-fit rounded-full border px-2.5 py-1 text-xs font-medium">
          {member.user.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {isOwner ? (
        <div className="mt-5 rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium">Owner · All Events</p>
          <p className="mt-1 text-muted-foreground">
            Owner authority cannot be changed through ordinary team management.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">
              Role
              <select
                value={draftRole}
                disabled={isSaving}
                onChange={(event) =>
                  changeRole(event.target.value as UpdateTeamAccess["role"])
                }
                className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"
              >
                <option value="MANAGER">Manager</option>
                <option value="STAFF">Staff</option>
                <option value="SCANNER">Scanner</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Event access
              <select
                value={scope}
                disabled={isSaving || draftRole === "SCANNER"}
                onChange={(event) =>
                  changeScope(event.target.value as OrganizationAccessScope)
                }
                className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"
              >
                <option value="ALL_EVENTS">All Events</option>
                <option value="ASSIGNED_EVENTS">Selected Events</option>
              </select>
            </label>
          </div>

          {scope === "ASSIGNED_EVENTS" ? (
            <fieldset>
              <legend className="text-sm font-medium">Assigned Events</legend>
              <p className="mt-1 text-xs text-muted-foreground">
                No selection means this person has no Event access.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {events.map((event) => (
                  <label
                    key={event.id}
                    className="flex items-start gap-3 rounded-lg border p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={eventIds.includes(event.id)}
                      disabled={isSaving}
                      onChange={() => toggleEvent(event.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-medium">{event.name}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {new Date(event.startDate).toLocaleDateString("en-AU")}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save access"}
            </Button>
            {message ? (
              <p role="status" className="text-sm text-muted-foreground">
                {message}
              </p>
            ) : null}
          </div>
          {member.role === "MANAGER" ? (
            <div className="rounded-lg border border-destructive/20 p-4">
              <p className="text-sm font-medium">Reset Manager MFA</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Revokes this Manager&apos;s sessions, authenticator and recovery codes. Owners cannot be reset here.
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  value={resetReason}
                  onChange={(event) => setResetReason(event.target.value)}
                  placeholder="Reason for reset"
                  maxLength={200}
                  className="h-10 flex-1 rounded-lg border bg-background px-3 text-sm"
                />
                <Button variant="outline" onClick={resetManagerMfa} disabled={isSaving}>
                  Reset MFA
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}

function roleLabel(role: OrganizationRole) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function StateCard({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-6 ${error ? "border-destructive/30 text-destructive" : ""}`}
    >
      {children}
    </div>
  );
}
