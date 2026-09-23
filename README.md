# StealerLogs-ts

Official typescript library for the [stealerlogs.com](https://stealerlogs.com) API

- [StealerLogs-ts](#stealerlogs-ts)
  - [Installation](#installation)
  - [Quick start](#quick-start)
  - [Getting your api key](#getting-your-api-key)
  - [Other examples](#other-examples)

## Installation

```sh-session
bun add github:stealerlogs-com/stealerlogs-ts
```

## Quick start

Example usage

```ts
import { Client } from "stealerlogs";

async function main() {
  const sl = new Client("MY_API_KEY");

  const response = await sl.search({
    type: "email",
    query: "example@example.com",
  });

  console.log(response.hits);
}

main();
```

## Getting your api key

1. Visit https://stealerlogs.com/account
2. Sign in or create an account
3. Copy your API key

## Other examples

<details>
<summary>Regex search</summary>

```ts
import { Client } from "stealerlogs";

async function main() {
  const sl = new Client("MY_API_KEY");

  const response = await sl.search({
    type: "email",
    query: String.raw`admin\@gmail\.com`,
    regex: true,
  });

  console.log(response.hits);
}

main();
```

</details>

<details>
<summary>Hide results with no files</summary>

```ts
import { Client } from "stealerlogs";

async function main() {
  const sl = new Client("MY_API_KEY");

  const response = await sl.search({
    type: "email",
    query: "example@example.com",
    files: true,
  });

  console.log(response.hits);
}

main();
```

</details>

<details>
<summary>Log credentials</summary>

```ts
import { Client } from "stealerlogs";

async function main() {
  const sl = new Client("MY_API_KEY");

  const response = await sl.credentials("LOG_ID", { page: 1 });

  console.log(response.count, response.hasNext);
  console.log(response.items);
}

main();
```

</details>

<details>
<summary>Cookies</summary>

```ts
import { Client } from "stealerlogs";

async function main() {
  const sl = new Client("MY_API_KEY");

  const response = await sl.cookies("LOG_ID", { page: 1 });

  console.log(response.domains);
  console.log(response.items);
}

main();
```

</details>

<details>
<summary>Filter cookies by domain</summary>

```ts
import { Client } from "stealerlogs";

async function main() {
  const sl = new Client("MY_API_KEY");

  const response = await sl.cookies("LOG_ID", {
    page: 1,
    domains: [".youtube.com", ".google.com"],
    hideExpired: true,
  });

  console.log(response.count, response.hasNext);
  console.log(response.items);
}

main();
```

</details>

<details>
<summary>Files and file content</summary>

```ts
import { Client } from "stealerlogs";

async function main() {
  const sl = new Client("MY_API_KEY");

  const files = await sl.files("LOG_ID", { page: 1 });
  console.log(files.items);

  const content = await sl.content("LOG_ID", "Autofill/Chrome.txt");
  console.log(content.path, content.size);
  console.log(content.content);
}

main();
```

</details>

<details>
<summary>Custom fetch</summary>

```ts
import { Client } from "stealerlogs";

async function main() {
  const sl = new Client("MY_API_KEY", {
    fetch: globalThis.fetch,
  });
  // ...
}

main();
```

</details>
