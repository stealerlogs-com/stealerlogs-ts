import { afterAll, describe, expect, test } from "bun:test";
import {
  ApiError,
  Client,
  InvalidApiKeyError,
  InvalidRequestError,
  NotFoundError,
} from "../src/index.ts";

type Handler = (req: Request, url: URL) => Response | Promise<Response>;

function startServer(handler: Handler) {
  const server = Bun.serve({
    port: 0,
    fetch(req) {
      return handler(req, new URL(req.url));
    },
  });

  const client = new Client("sl_test_key", {
    baseUrl: `http://127.0.0.1:${server.port}/api`,
  });

  return { server, client };
}

describe("search", () => {
  const { server, client } = startServer((req, url) => {
    expect(url.pathname).toBe("/api/search");
    expect(req.headers.get("Authorization")).toBe("Bearer sl_test_key");
    expect(url.searchParams.get("q")).toBe("example@example.com");
    expect(url.searchParams.get("type")).toBe("email");
    expect(url.searchParams.get("regex")).toBe("1");
    expect(url.searchParams.get("files")).toBe("1");
    return Response.json({
      hits: [
        {
          id: "file_abc123",
          dataType: "stealerlog",
          origin: "https://accounts.google.com",
          login: "example@example.com",
          password: "Summer2024!",
          source: "@cloudlogs",
          timeIngested: "2026-09-18T14:22:03Z",
          timePosted: "2026-09-18T14:22:03Z",
        },
      ],
    });
  });
  afterAll(() => server.stop(true));

  test("sends query flags and parses hits", async () => {
    const resp = await client.search({
      type: "email",
      query: "example@example.com",
      regex: true,
      files: true,
    });
    expect(resp.hits).toHaveLength(1);
    expect(resp.hits[0]?.id).toBe("file_abc123");
    expect(resp.hits[0]?.dataType).toBe("stealerlog");
  });
});

test("search validation", async () => {
  const sl = new Client("key");
  await expect(sl.search({ type: "email", query: "" })).rejects.toBeInstanceOf(
    InvalidRequestError,
  );
  await expect(sl.search({ type: "" as "email", query: "x" })).rejects.toBeInstanceOf(
    InvalidRequestError,
  );
});

describe("credentials", () => {
  const { server, client } = startServer((_req, url) => {
    expect(url.pathname).toBe("/api/logs/abc/credentials");
    expect(url.searchParams.get("page")).toBe("2");
    return Response.json({
      kind: "credentials",
      count: 318,
      page: 2,
      hasNext: true,
      hasPrev: true,
      items: [
        {
          origin: "https://accounts.google.com",
          login: "user@gmail.com",
          password: "secret",
          file: "passwords.txt",
          category: "personal",
          tags: ["signin"],
          host: "accounts.google.com",
          reused: true,
          reuseCount: 3,
        },
      ],
    });
  });
  afterAll(() => server.stop(true));

  test("pages credentials", async () => {
    const resp = await client.credentials("abc", { page: 2 });
    expect(resp.count).toBe(318);
    expect(resp.hasNext).toBe(true);
    expect(resp.hasPrev).toBe(true);
    expect(resp.items[0]?.reuseCount).toBe(3);
  });
});

describe("cookies", () => {
  const { server, client } = startServer((_req, url) => {
    expect(url.pathname).toBe("/api/logs/abc/cookies");
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("domains")).toBe(".youtube.com,.google.com");
    expect(url.searchParams.get("hide_expired")).toBe("1");
    return Response.json({
      kind: "cookies",
      count: 4806,
      page: 1,
      hasNext: true,
      hasPrev: false,
      items: [
        {
          domain: ".youtube.com",
          path: "/",
          name: "PREF",
          value: "1",
          expires: 1824273462,
          secure: true,
          expired: false,
          file: "Cookies/Chrome.txt",
        },
      ],
      domains: [".youtube.com", ".google.com"],
    });
  });
  afterAll(() => server.stop(true));

  test("filters cookies by domain", async () => {
    const resp = await client.cookies("abc", {
      page: 1,
      domains: [".youtube.com", ".google.com"],
      hideExpired: true,
    });
    expect(resp.count).toBe(4806);
    expect(resp.items).toHaveLength(1);
    expect(resp.domains).toHaveLength(2);
  });
});

describe("files and content", () => {
  const { server, client } = startServer((_req, url) => {
    if (url.pathname === "/api/logs/abc/files") {
      return Response.json({
        kind: "files",
        count: 1,
        page: 1,
        hasNext: false,
        hasPrev: false,
        items: [
          {
            name: "Chrome.txt",
            path: "Autofill/Chrome.txt",
            size: null,
            type: "txt",
            hash: "",
            content: "",
          },
        ],
      });
    }
    expect(url.pathname).toBe("/api/logs/abc/content");
    expect(url.searchParams.get("path")).toBe("Autofill/Chrome.txt");
    return Response.json({
      name: "Chrome.txt",
      path: "Autofill/Chrome.txt",
      size: 12,
      type: "txt",
      hash: "",
      content: "name: value",
    });
  });
  afterAll(() => server.stop(true));

  test("lists files and reads content", async () => {
    const files = await client.files("abc");
    expect(files.items[0]?.path).toBe("Autofill/Chrome.txt");
    expect(files.items[0]?.size).toBeNull();

    const content = await client.content("abc", "Autofill/Chrome.txt");
    expect(content.content).toBe("name: value");
    expect(content.size).toBe(12);
  });
});

describe("errors", () => {
  test("unauthorized", async () => {
    const { server, client } = startServer(() =>
      Response.json({ error: "A valid API key is required." }, { status: 401 }),
    );
    try {
      await client.search({ type: "email", query: "a@b.c" });
      throw new Error("expected failure");
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidApiKeyError);
    } finally {
      server.stop(true);
    }
  });

  test("missing query", async () => {
    const { server, client } = startServer(() =>
      Response.json({ error: "Missing q." }, { status: 400 }),
    );
    try {
      await client.search({ type: "email", query: "x" });
      throw new Error("expected failure");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
      expect((err as ApiError).message).toBe("Missing q.");
    } finally {
      server.stop(true);
    }
  });

  test("not found", async () => {
    const { server, client } = startServer(() =>
      Response.json({ error: "Document not found." }, { status: 404 }),
    );
    try {
      await client.credentials("missing");
      throw new Error("expected failure");
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
      expect((err as NotFoundError).message).toBe("Document not found.");
    } finally {
      server.stop(true);
    }
  });
});
