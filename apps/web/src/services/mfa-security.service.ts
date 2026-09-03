import { api } from "@/lib/api";

export interface MfaStatus {
  required: boolean;
  enrolled: boolean;
  activatedAt: string | null;
  remainingRecoveryCodes: number;
}

export const mfaSecurityService = {
  status: () => api.get<MfaStatus>("/auth/security"),
  regenerateCodes: (password: string, code: string) =>
    api.post<{ recoveryCodes: string[] }>(
      "/auth/mfa/recovery-codes/regenerate",
      { password, code },
    ),
  startRotation: (password: string, code: string) =>
    api.post<{
      challengeToken: string;
      setup: { secret: string; qrCodeDataUrl: string };
    }>("/auth/mfa/rotation/start", { password, code }),
  confirmRotation: (challengeToken: string, code: string) =>
    api.post<{ recoveryCodes: string[] }>("/auth/mfa/rotation/confirm", {
      challengeToken,
      code,
    }),
  resetManager: (userId: string, reason: string) =>
    api.post<{ reset: true }>(`/auth/mfa/team/${userId}/reset`, { reason }),
};
