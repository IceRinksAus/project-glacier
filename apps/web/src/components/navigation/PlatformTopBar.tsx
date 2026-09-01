"use client";

import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  getAuthUserSnapshot,
  getServerAuthUserSnapshot,
  endAuthSession,
  subscribeAuthSession,
} from "@/lib/auth";

export function PlatformTopBar() {
  const router = useRouter();
  const user = useSyncExternalStore(
    subscribeAuthSession,
    getAuthUserSnapshot,
    getServerAuthUserSnapshot,
  );
  const displayName = user?.name ?? "Glacier User";
  const displayRole = user?.role ? roleLabel(user.role) : "Signed in";
  const initials = getInitials(displayName);

  async function signOut() {
    await endAuthSession();
    router.replace("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Organisation
        </p>

        <button className="flex items-center gap-1 text-sm font-semibold">
          Ice Rinks Australia
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
        </Button>

        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initials}
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {displayRole}
            </p>
          </div>

          <ChevronDown className="size-4 text-muted-foreground" />
        </div>

        <Button variant="ghost" size="sm" onClick={() => void signOut()}>
          <LogOut className="mr-2 size-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
}

function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "GU";
  return `${parts[0][0] ?? ""}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}
