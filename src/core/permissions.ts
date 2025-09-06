import isDev from "electron-is-dev";

export enum PermissionLevel {
  Guest = 0,
  User = 1,
  Power = 2,
  Admin = 3,
  Developer = 99,
}

export type TokenLike = {
  tier?: number;
  perms?: string[];
} | null;

// Map Token to our internal permission level
export function getPermissionLevel(token: TokenLike): PermissionLevel {
  if (!token) return PermissionLevel.Guest;
  const perms = (token.perms || []).map(p => p.toLowerCase());
  if (perms.includes("developer") || perms.includes("dev")) return PermissionLevel.Developer;
  if (perms.includes("admin") || (token.tier ?? 0) >= 99) return PermissionLevel.Admin;
  if ((token.tier ?? 0) >= 50) return PermissionLevel.Power;
  if ((token.tier ?? 0) >= 1) return PermissionLevel.User;
  return PermissionLevel.Guest;
}

export function hasPermission(token: TokenLike, required: PermissionLevel): boolean {
  const level = getPermissionLevel(token);
  if (required === PermissionLevel.Developer) return isDev && level >= PermissionLevel.Developer;
  return level >= required;
}

export function isDeveloperMode(): boolean {
  return isDev;
}
