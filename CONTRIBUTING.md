# Contributing

```bash
npm ci
npm run lint && npm run format:check && npm run typecheck && npm test && npm run build
```

- Run `npm run format` before committing.
- Add tests for behavior changes (`src/**/__tests__`); providers and tools are tested with a mocked `fetch`, no real API keys needed.
- Use [Conventional Commits](https://www.conventionalcommits.org/) and update `CHANGELOG.md`.

## Releasing

1. Update `CHANGELOG.md` and bump `version` in `package.json`, and `version` fields in `server.json`.
2. Commit, then tag: `git tag vX.Y.Z && git push --tags`.
3. The `Release` workflow verifies the tag against `package.json` and publishes to npm with provenance (requires the `NPM_TOKEN` repository secret).
