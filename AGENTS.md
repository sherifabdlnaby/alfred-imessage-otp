# AGENTS.md

## Toolchain (mise)

This project uses [**mise**](https://mise.jdx.dev) to pin tools, expose tasks, and wire git hooks. `mise.toml` is the source of truth. Don't install tools by hand or add ad-hoc scripts; add a mise tool or task instead.

**Setup** (once, and per new worktree): `mise trust && mise run setup`.

**Run via mise.** Run `mise run check` before you call work done. A few examples, not the full list:

```sh
mise run check          # all linters/formatters/validators (alias: lint); add --fix to auto-fix
mise run build          # zip src/ into the .alfredworkflow (--version stamps info.plist)
mise run test           # tests (placeholder — none yet)
mise tasks              # discover every task
mise run <task> --help  # a task's flags
mise run check --step eslint  # one hk step for a short feedback loop (--skip-step skips one)
```

Prefer `mise run <task>` over calling the tool directly, so local, hooks, and CI stay in sync.

## Git hooks (hk)

Commits run [hk](https://hk.jdx.dev) commit gates on staged files, and a push runs the push gates; CI runs both as `mise run check`, so a green commit is not yet a green CI. Fix failures with `mise run check --fix`. Don't disable steps to push a commit through; `git commit --no-verify` skips hooks for a WIP commit. `mise install` installs the hooks; on Git 2.54+ they live in git config, so an empty `.git/hooks/` does not mean there are no hooks.

## Releases

Merging to `main` with a bump label (`major` / `minor` / `patch`) tags, builds the `.alfredworkflow`, attests provenance, and publishes a GitHub Release. Use `skip-release` when the change should not cut a version. Category labels (`feature`, `bug`, `docs`, `ci`, …) only group the generated notes. Manual RC: Actions → Release → `prerelease: true`.

## Project notes

- `src/` holds the workflow source (`index.js`, `utils/`, `info.plist`, `icon.png`). `mise run deps` vendors `run-node` into `src/node_modules/`; `mise run build` zips `src/` (source + node_modules) into the `.alfredworkflow`. `src/node_modules/` is gitignored and excluded from linting (see `.config/hk.pkl`'s `commonIgnores`); never edit or lint it.
- `info.plist` carries a placeholder version (`1.3.37`). `mise run build --version vX.Y.Z` stamps the real version into a throwaway copy at build time, then restores the placeholder so the tree stays clean.
- `mise run clean` removes `build/` and `src/node_modules/`.
- JS lint/format: `prettier` (JS/JSON) + `eslint` (flat config at `eslint.config.js`, self-contained — no plugin requires, since eslint runs from a mise-managed install off the project's module path).

## Extending the setup

Changing tools, tasks, env, mise hooks, or pre-commit hooks? Edit the config, don't bolt on scripts, then run `mise run check`. Where things live:

- **`mise.toml`**: the source of truth for `[tools]`, `[tasks]`, `[env]`/`[vars]`, `[hooks]`, `[doctor]`, and `[settings]`.
- **`mise.lock`**: resolved versions plus checksums. Commit it; regenerate with `mise install` then `mise lock --platform macos-arm64,linux-x64` after a `[tools]` change.
- **`.config/mise/`**: project-local state, like the gitignored setup stamp the `setup`/`enter` hooks read. Tasks that outgrow TOML live in `.config/mise/tasks/` as executable file tasks.
- **`.config/hk.pkl`**: the pre-commit and `check` pipeline (linters and formatters, in Pkl). Add a lint step to the commit gates or push gates tier here.
- Linter configs live at the repo root, where each tool finds them by default (zizmor's is under `.github/`).

For tool, task, and hook syntax, see the [mise](https://mise.jdx.dev) and [hk](https://hk.jdx.dev) docs.
