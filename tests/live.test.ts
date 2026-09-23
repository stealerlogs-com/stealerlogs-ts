import { expect, test } from "bun:test";
import { Client, InvalidApiKeyError } from "../src/index.ts";

const apiKey = process.env.STEALERLOGS_API_KEY;

test("empty search", async () => {
  if (!apiKey) {
    console.warn("skipping live test: STEALERLOGS_API_KEY is not set");
    return;
  }

  const client = new Client(apiKey);
  const search = await client.search({
    type: "email",
    query: "zzzzzznotfound12345@example.invalid",
  });
  expect(search.hits).toEqual([]);
}, 30_000);

test("log endpoints", async () => {
  if (!apiKey) {
    console.warn("skipping live test: STEALERLOGS_API_KEY is not set");
    return;
  }

  const client = new Client(apiKey);
  const logId = "3qzOQmky1-6kd1eum5QC";

  const creds = await client.credentials(logId, { page: 1 });
  expect(creds.kind).toBe("credentials");
  expect(creds.page).toBe(1);
  expect(creds.items.length).toBeGreaterThan(0);

  const cookies = await client.cookies(logId, {
    page: 1,
    domains: [".youtube.com"],
    hideExpired: true,
  });
  expect(cookies.kind).toBe("cookies");
  expect(cookies.domains.length).toBeGreaterThan(0);

  const files = await client.files(logId, { page: 1 });
  expect(files.kind).toBe("files");
  if (files.items[0]) {
    const content = await client.content(logId, files.items[0].path);
    expect(content.path).toBe(files.items[0].path);
  }
}, 60_000);

test("me", async () => {
  if (!apiKey) {
    console.warn("skipping live test: STEALERLOGS_API_KEY is not set");
    return;
  }

  const client = new Client(apiKey);
  const account = await client.me();
  expect(account.plan.length).toBeGreaterThan(0);
  expect(account.planName.length).toBeGreaterThan(0);
  expect(account.expiresAt.length).toBeGreaterThan(0);
  expect(account.daysLeft).toBeGreaterThanOrEqual(0);
  expect(account.limits.searchesPerDay).toBeGreaterThanOrEqual(0);
  expect(account.limits.searchesUsed).toBeGreaterThanOrEqual(0);
  expect(account.limits.searchesRemaining).toBeGreaterThanOrEqual(0);
  expect(account.limits.resetsAt.length).toBeGreaterThan(0);
}, 30_000);

test("invalid key", async () => {
  if (!apiKey) {
    console.warn("skipping live test: STEALERLOGS_API_KEY is not set");
    return;
  }

  const client = new Client("sl_invalid");
  await expect(client.search({ type: "email", query: "a@b.c" })).rejects.toBeInstanceOf(
    InvalidApiKeyError,
  );
});
