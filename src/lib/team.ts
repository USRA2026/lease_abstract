import { db } from "@/lib/db";

/**
 * Resolves the current team. This app seeds a single team and has no auth
 * layer yet, so everything is scoped to the first (only) team — centralized
 * here so it's the one place to swap in real auth/session-based scoping later.
 */
export async function getTeamId(): Promise<string> {
  const team = await db.team.findFirstOrThrow();
  return team.id;
}
