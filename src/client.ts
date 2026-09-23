import {
  ApiError,
  InvalidApiKeyError,
  InvalidRequestError,
  NotFoundError,
  RateLimitError,
  ServerError,
} from "./errors.js";
import {
  DEFAULT_BASE_URL,
  type Account,
  type ClientOptions,
  type CookieOptions,
  type CookiesResponse,
  type CredentialsResponse,
  type File,
  type FilesResponse,
  type PageOptions,
  type SearchOptions,
  type SearchResponse,
} from "./types.js";

type Query = Record<string, string | undefined>;

export class Client {
  readonly apiKey: string;
  readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(apiKey: string, options: ClientOptions = {}) {
    this.apiKey = apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  me(): Promise<Account> {
    return this.get("/me", {});
  }

  search(options: SearchOptions): Promise<SearchResponse> {
    if (!options.query) {
      return Promise.reject(new InvalidRequestError("query is required"));
    }
    if (!options.type) {
      return Promise.reject(new InvalidRequestError("type is required"));
    }

    return this.get("/search", {
      q: options.query,
      type: options.type,
      regex: options.regex ? "1" : undefined,
      files: options.files ? "1" : undefined,
    });
  }

  credentials(logId: string, options: PageOptions = {}): Promise<CredentialsResponse> {
    if (!logId) {
      return Promise.reject(new InvalidRequestError("log id is required"));
    }
    return this.get(`/logs/${encodeURIComponent(logId)}/credentials`, {
      page: String(pageValue(options.page)),
    });
  }

  cookies(logId: string, options: CookieOptions = {}): Promise<CookiesResponse> {
    if (!logId) {
      return Promise.reject(new InvalidRequestError("log id is required"));
    }
    return this.get(`/logs/${encodeURIComponent(logId)}/cookies`, {
      page: String(pageValue(options.page)),
      domains: options.domains?.length ? options.domains.join(",") : undefined,
      hide_expired: options.hideExpired ? "1" : undefined,
    });
  }

  files(logId: string, options: PageOptions = {}): Promise<FilesResponse> {
    if (!logId) {
      return Promise.reject(new InvalidRequestError("log id is required"));
    }
    return this.get(`/logs/${encodeURIComponent(logId)}/files`, {
      page: String(pageValue(options.page)),
    });
  }

  content(logId: string, path: string): Promise<File> {
    if (!logId) {
      return Promise.reject(new InvalidRequestError("log id is required"));
    }
    if (!path) {
      return Promise.reject(new InvalidRequestError("path is required"));
    }
    return this.get(`/logs/${encodeURIComponent(logId)}/content`, { path });
  }

  private async get<T>(path: string, query: Query): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }

    const response = await this.fetchFn(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    const body = await response.text();

    if (response.ok) {
      return JSON.parse(body) as T;
    }

    if (response.status === 401) {
      throw new InvalidApiKeyError();
    }

    if (response.status === 429) {
      throw new RateLimitError();
    }

    const message = parseErrorMessage(body);

    if (response.status === 404) {
      throw new NotFoundError(message);
    }

    if (response.status === 400) {
      throw new ApiError(400, message);
    }

    if (!body.trim()) {
      throw new ServerError();
    }

    throw new ApiError(response.status, message);
  }
}

function pageValue(page?: number): number {
  return !page || page < 1 ? 1 : page;
}

function parseErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: string };
    if (parsed.error) {
      return parsed.error;
    }
  } catch {
    // fall through
  }
  return body.trim();
}
