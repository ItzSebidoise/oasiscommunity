export type AppRole =
  | "portal_owner" | "portal_leadership"
  | "cs16_owner" | "cs16_leadership" | "cs16_admin"
  | "ts3_owner" | "ts3_leadership" | "ts3_admin";

export const ALL_ROLES: AppRole[] = [
  "portal_owner","portal_leadership",
  "cs16_owner","cs16_leadership","cs16_admin",
  "ts3_owner","ts3_leadership","ts3_admin",
];

export const ROLE_META: Record<AppRole, { label: string; className: string }> = {
  portal_owner:    { label: "Majitel Portálu",         className: "text-red-500" },
  portal_leadership:{ label: "Vedení Portálu",         className: "text-purple-500" },
  cs16_owner:      { label: "Cs1.6 Majitel Jailbreak", className: "text-red-500" },
  cs16_leadership: { label: "Cs1.6 Vedení Jailbreak",  className: "text-purple-500" },
  cs16_admin:      { label: "Cs1.6 Admin Jailbreak",   className: "text-purple-500" },
  ts3_owner:       { label: "TS3 Majitel",             className: "text-red-500" },
  ts3_leadership:  { label: "TS3 Vedení",              className: "text-purple-500" },
  ts3_admin:       { label: "TS3 Admin",               className: "text-purple-500" },
};

export const LEADERSHIP_ROLES: AppRole[] = [
  "portal_owner","portal_leadership",
  "cs16_owner","cs16_leadership","ts3_owner","ts3_leadership",
];

export const PORTAL_LEADERSHIP_ROLES: AppRole[] = [
  "portal_owner","portal_leadership","cs16_owner","ts3_owner",
];
