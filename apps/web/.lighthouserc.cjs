module.exports = {
  ci: {
    collect: {
      // Command to start the dev server (Cloudflare Worker preview)
      startServerCommand: "pnpm wrangler dev --local --port 8787",
      startServerReadyPattern: "Ready on", // wait for "Ready on ..." log
      url: [
        "http://localhost:8787/", // Home page
      ],
      numberOfRuns: 3, // Lighthouse runs per URL (3 by default for median)
    },
    upload: {
      target: "temporary-public-storage", // Upload reports for 7 days (optional)
    },
    // (Optional) add `assert` here to set performance budgets or score thresholds.
  },
};
