// Simulated identity for v1 (§3: no real auth; a role switcher simulates users).
// The cookie holds "admin" | "ops" | "cleaner:<userId>".

export type Role =
  | { kind: "admin" }
  | { kind: "ops" }
  | { kind: "cleaner"; userId: string };

export function parseRole(cookieValue: string | undefined): Role {
  if (cookieValue === "ops") return { kind: "ops" };
  if (cookieValue?.startsWith("cleaner:")) {
    return { kind: "cleaner", userId: cookieValue.slice("cleaner:".length) };
  }
  return { kind: "admin" };
}

export function serializeRole(role: Role): string {
  if (role.kind === "cleaner") return `cleaner:${role.userId}`;
  return role.kind;
}
