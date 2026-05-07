import { exports } from "cloudflare:workers";
import {
  buildCommandInteraction,
  buildPingInteraction,
  createSignedDiscordRequest,
  TEST_KEYPAIR,
} from "@dougley/frugal-test-utils/discord";
import { describe, expect, it } from "vitest";

const worker = exports.default;

describe("E2E: request pipeline", () => {
  it("responds to PING with PONG", async () => {
    const body = JSON.stringify(buildPingInteraction());
    const request = createSignedDiscordRequest(TEST_KEYPAIR, body);
    const response = await worker.fetch(request);

    expect(response.status).toBe(200);
    const data = (await response.json()) as { type: number };
    expect(data.type).toBe(1);
  });

  it("rejects requests with invalid signatures (401)", async () => {
    const body = JSON.stringify(buildPingInteraction());
    const request = new Request("http://localhost/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-signature-ed25519": "0".repeat(128),
        "x-signature-timestamp": new Date().toISOString(),
      },
      body,
    });

    const response = await worker.fetch(request);
    expect(response.status).toBe(401);
  });

  it("rejects non-POST requests (405)", async () => {
    const request = new Request("http://localhost/", { method: "GET" });
    const response = await worker.fetch(request);
    expect(response.status).toBe(405);
  });

  it("handles unknown slash commands gracefully", async () => {
    const body = JSON.stringify(
      buildCommandInteraction({
        commandName: "nonexistent",
        options: [],
      })
    );
    const request = createSignedDiscordRequest(TEST_KEYPAIR, body);
    const response = await worker.fetch(request);
    expect(response.status).toBe(200);
  });
});
