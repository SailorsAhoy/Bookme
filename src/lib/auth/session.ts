import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

/**
 * Get the current session (server components / server actions).
 */
export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/**
 * Require an authenticated user. Redirects to /login if none.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/**
 * Require a specific role (or higher).
 * Hierarchy: PLATFORM_ADMIN > OWNER > ADMIN > STAFF
 */
export async function requireRole(
  allowed: Array<"OWNER" | "ADMIN" | "STAFF" | "PLATFORM_ADMIN">
): Promise<Session> {
  const session = await requireAuth();
  const role = session.user.role;

  if (role === "PLATFORM_ADMIN") return session; // platform admins can do everything

  if (!allowed.includes(role)) {
    redirect("/dashboard?error=unauthorized");
  }

  return session;
}

/**
 * Convenience for admin-only pages.
 */
export async function requireAdmin() {
  return requireRole(["OWNER", "ADMIN", "PLATFORM_ADMIN"]);
}

/**
 * Convenience for owner-only (billing, destructive actions).
 */
export async function requireOwner() {
  return requireRole(["OWNER", "PLATFORM_ADMIN"]);
}
