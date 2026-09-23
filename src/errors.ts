export class StealerlogsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidApiKeyError extends StealerlogsError {
  constructor(message = "invalid api key") {
    super(message);
  }
}

export class NotFoundError extends StealerlogsError {
  readonly status = 404;

  constructor(message = "not found") {
    super(message);
  }
}

export class InvalidRequestError extends StealerlogsError {
  constructor(message: string) {
    super(message);
  }
}

export class ApiError extends StealerlogsError {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class RateLimitError extends StealerlogsError {
  readonly limit?: number;
  readonly remaining?: number;

  constructor(message = "rate limit reached", limit?: number, remaining?: number) {
    super(message);
    this.limit = limit;
    this.remaining = remaining;
  }
}

export class ServerError extends StealerlogsError {
  constructor(message = "server returned an error") {
    super(message);
  }
}
