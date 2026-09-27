export type RateLimiter = {
  allow(key: string): boolean;
};

export function createRateLimiter(options: { windowMs: number; max: number }): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    allow(key: string) {
      const now = Date.now();
      const recent = (hits.get(key) ?? []).filter((time) => now - time < options.windowMs);
      if (recent.length >= options.max) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      return true;
    },
  };
}
