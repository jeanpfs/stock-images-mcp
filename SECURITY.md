# Security Policy

## Reporting a vulnerability

Please report vulnerabilities privately through
[GitHub Security Advisories](https://github.com/jeanpfs/stock-images-mcp/security/advisories/new).
Do not open a public issue. Expect an initial response within 7 days.

## Scope and design notes

- `download_image` only fetches `https` URLs on `pexels.com`, `unsplash.com` and `pixabay.com`
  (redirects included), writes only inside the download directory, accepts `image/*` only,
  caps files at 50 MiB and never overwrites existing files.
- API keys are read from environment variables and are never written to disk or returned in tool output.
