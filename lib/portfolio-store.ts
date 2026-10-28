export type Portfolio = {
  title: string;
  lastSavedAt: string;
  status: "draft" | "published";
};

/**
 * In-memory, per-process store keyed by user id. Good enough to prove the
 * "returning user sees their own data, no one else's" behaviour for this
 * story; swap for a real database once one is provisioned for the project.
 */
const portfoliosByUserId = new Map<string, Portfolio>();

export function getPortfolioForUser(userId: string): Portfolio | null {
  return portfoliosByUserId.get(userId) ?? null;
}

export function savePortfolioForUser(userId: string, portfolio: Portfolio): void {
  portfoliosByUserId.set(userId, portfolio);
}

export function clearStoreForTests(): void {
  portfoliosByUserId.clear();
}
