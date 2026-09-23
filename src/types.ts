export const DEFAULT_BASE_URL = "https://stealerlogs.com/api";

export const SearchType = {
  Url: "url",
  Email: "email",
  EmailDomain: "email_domain",
  Username: "username",
  Password: "password",
  Ip: "ip",
} as const;

export type SearchType = (typeof SearchType)[keyof typeof SearchType];

export const DataType = {
  StealerLog: "stealerlog",
  Combo: "combo",
} as const;

export type DataType = (typeof DataType)[keyof typeof DataType] | (string & {});

export interface ClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
}

export interface SearchOptions {
  type: SearchType;
  query: string;
  /** Treat `query` as a regular expression (`regex=1`). */
  regex?: boolean;
  /** Hide results with no files (`files=1`). */
  files?: boolean;
}

export interface PageOptions {
  page?: number;
}

export interface CookieOptions extends PageOptions {
  /** Return cookies for these hosts instead of paging the whole log. */
  domains?: string[];
  /** Omit expired cookies (`hide_expired=1`). */
  hideExpired?: boolean;
}

export interface Hit {
  id: string;
  dataType: DataType;
  origin: string;
  login: string;
  password: string;
  source: string;
  timeIngested: string;
  timePosted: string;
}

export interface SearchResponse {
  hits: Hit[];
}

export interface Credential {
  origin: string;
  login: string;
  password: string;
  file: string;
  category: string;
  tags: string[];
  host: string;
  reused: boolean;
  reuseCount: number;
}

export interface Cookie {
  domain: string;
  path: string;
  name: string;
  value: string;
  expires: number;
  secure: boolean;
  expired: boolean;
  file: string;
}

export interface File {
  name: string;
  path: string;
  size: number | null;
  type: string;
  hash: string;
  content: string;
}

export interface CredentialsResponse {
  kind: string;
  count: number;
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
  items: Credential[];
}

export interface CookiesResponse {
  kind: string;
  count: number;
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
  items: Cookie[];
  domains: string[];
}

export interface FilesResponse {
  kind: string;
  count: number;
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
  items: File[];
}
