# Changelog

## 2.0.0 - 2026-10-02

### Breaking

- `download_image`: `folder` is now a subfolder of the download directory (`./downloads` or `STOCK_IMAGES_DOWNLOAD_DIR`); paths outside it are rejected.
- `download_image`: only `https` URLs on pexels.com, unsplash.com and pixabay.com are accepted; only `image/*` responses are saved.
- `download_image`: filenames are restricted to `[A-Za-z0-9_.-]` and existing files are no longer overwritten.

### Fixed

- Unsplash `square` orientation now maps to `squarish` (previously the request failed).
- Pixabay `square` orientation is filtered client-side (previously ignored).
- Provider failures are reported in `errors` instead of being silently dropped; failures set `isError`.
- Unsplash downloads call the `download_location` endpoint as required by the API guidelines.
- Requesting a provider without an API key returns a clear error.
- Dependency vulnerabilities (`npm audit`: 0).

### Added

- Request timeout (10 s) and retries on network errors, 429 and 502/503/504.
- Download size limit (50 MiB) and 30 s timeout.
- ESLint, Prettier, stricter TypeScript, CI, Dependabot, release workflow, `server.json`.
