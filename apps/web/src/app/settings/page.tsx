"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ShieldCheck, UserRoundCog } from "lucide-react";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";
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
    if (role !== "OWNER") {
      return;
    }
    let cancelled = false;
    Promise.all([teamAccessService.getTeam(), eventService.getEvents()])
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
            Team and Access
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Decide what each person can do and which Events they can access.
            Changes take effect against their current membership immediately.
          </p>
        </header>

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
      </div>
    </PlatformShell>
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
  const [scope, setScope] = useState<OrganizationAccessScope>(member.accessScope);
  const [eventIds, setEventIds] = useState(
    member.user.eventAccess.map(({ event }) => event.id),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

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
