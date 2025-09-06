import { PermissionLevel, getPermissionLevel } from "./permissions";

export type TokenLike = {
  tier?: number;
  perms?: string[];
} | null;

// Returns true if token is allowed to toggle a cheat identified by id (matches data-cheat)
export function isCheatAllowed(token: TokenLike, id: string): boolean {
  if (!token) return false;
  const level = getPermissionLevel(token);
  if (level >= PermissionLevel.Admin) return true; // Admin/Dev allowed
  const perms = (token.perms || []).map(p => p.toLowerCase());
  return perms.includes(id.toLowerCase());
}
