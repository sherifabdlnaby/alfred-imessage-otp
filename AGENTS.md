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
```

Prefer `mise run <task>` over calling the tool directly, so local, hooks, and CI stay in sync.

## Git hooks (hk)

Commits run [hk](https://hk.jdx.dev), the same `check` CI runs, to format and lint staged files. Fix failures with `mise run check --fix`. Don't disable steps to push a commit through; `git commit --no-verify` skips hooks for a WIP commit.

## Project notes

- `src/` holds the workflow source (`index.js`, `utils/`, `info.plist`, `icon.png`). `mise run deps` vendors `run-node` into `src/node_modules/`; `mise run build` zips `src/` (source + node_modules) into the `.alfredworkflow`. `src/node_modules/` is gitignored and excluded from linting (see `hk.pkl`'s `commonIgnores`); never edit or lint it.
- `info.plist` carries a placeholder version (`1.3.37`). `mise run build --version vX.Y.Z` stamps the real version into a throwaway copy at build time, then restores the placeholder so the tree stays clean.
- `mise run clean` removes `build/` and `src/node_modules/`.
- JS lint/format: `prettier` (JS/JSON) + `eslint` (flat config at `eslint.config.js`, self-contained — no plugin requires, since eslint runs from a mise-managed install off the project's module path).

## Extending the setup

Changing tools, tasks, env, or hooks? Edit the config, don't bolt on scripts, then run `mise run check`. Where things live:

- **`mise.toml`**: the source of truth for `[tools]`, `[tasks]`, `[vars]`, `[settings]`, and `[hooks]`.
- **`mise.lock`**: resolved versions plus checksums. Commit it; regenerate with `mise install` then `mise lock --platform macos-arm64,linux-x64` after a `[tools]` change.
- **`.mise/`**: project-local state (gitignored), like the setup stamp the `setup`/`enter` hooks read.
- **`hk.pkl`**: the pre-commit and `check` pipeline (linters and formatters, in Pkl). Add or edit a lint step here.
- Linter config scaffolds live at the repo root (`eslint.config.js`, `.prettierrc.json`, `typos.toml`, `.betterleaks.toml`, `lychee.toml`, `rumdl.toml`, `.yamllint`) and `.github/zizmor.yml`.

For tool, task, and hook syntax, see the [mise](https://mise.jdx.dev) and [hk](https://hk.jdx.dev) docs.
