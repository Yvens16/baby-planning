export type Scene = "first" | "left";

export type Family = {
  name: string;
  timezone: string;
};

export type LastAction =
  | "none"
  | "created"
  | "joined"
  | "join-invalid"
  | "join-consumed";

export type Session = {
  email: string;
  scene: Scene;
  leftFamilyName: string;
  families: Family[];
  lastAction: LastAction;
  pendingJoin: Family | null;
};

export const TIMEZONES = [
  "Europe/Paris",
  "Europe/Brussels",
  "Europe/London",
  "America/Montreal",
  "America/New_York",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Africa/Abidjan",
  "Africa/Dakar",
  "Africa/Casablanca",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Pacific/Auckland",
  "UTC",
];

export function browserTimezone(): string {
  if (typeof Intl === "undefined") return "Europe/Paris";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris";
}

export function timezoneOptions(): string[] {
  const current = browserTimezone();
  return TIMEZONES.includes(current) ? TIMEZONES : [current, ...TIMEZONES];
}

export function parseInviteToken(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/join\/([A-Za-z0-9_-]+)/i);
  return match?.[1] ?? trimmed;
}

/** Stub invites — paste these in the prototype. */
export const STUB_INVITES = {
  valid: { token: "famille-martin", family: { name: "Famille Martin", timezone: "Europe/Paris" } },
  consumed: { token: "used-up" },
} as const;

export function lookupInvite(input: string):
  | { status: "valid"; family: Family }
  | { status: "consumed" }
  | { status: "invalid" } {
  const token = parseInviteToken(input);
  if (!token) return { status: "invalid" };
  if (token === STUB_INVITES.valid.token) {
    return { status: "valid", family: STUB_INVITES.valid.family };
  }
  if (token === STUB_INVITES.consumed.token) return { status: "consumed" };
  return { status: "invalid" };
}

export function validateFamilyName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 1) return "Le nom est obligatoire.";
  if (trimmed.length > 50) return "50 caractères maximum.";
  return null;
}

export function initialSession(scene: Scene): Session {
  return {
    email: "marie@example.com",
    scene,
    leftFamilyName: "Famille Dupont",
    families: [],
    lastAction: "none",
    pendingJoin: null,
  };
}
