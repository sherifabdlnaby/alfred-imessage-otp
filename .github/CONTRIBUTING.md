# Contributing

Thanks for your interest in contributing! Please read the [Code of Conduct](CODE_OF_CONDUCT.md) before getting started.

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Setup

This project uses [mise](https://mise.jdx.dev/) for tooling (Node, linters, hooks).

```bash
mise trust && mise run setup   # install tools, sync deps, install git hooks
mise run check                 # lint / format / validate (add --fix to auto-fix)
mise run build                 # zip the .alfredworkflow
mise run clean                 # remove build/ and src/node_modules/
```

## Pull Requests

- Keep changes focused and atomic
- Use descriptive PR titles (they feed into release notes)
- Add **one bump label** so the release gate knows what to cut on merge:
  - `major` / `minor` / `patch` — semver bump
  - `skip-release` — merge without tagging (CI, docs-only, chore)
- Category labels (`feature`, `bug`, `docs`, `ci`, …) group the generated release notes; the autolabeler applies many of them from the title/files
- Unlabeled merges fall back to `minor` (the gate fails on the PR so this is the escape hatch, not the happy path)
