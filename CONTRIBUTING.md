# Contributing to MobileGym

Thanks for considering contributing! This document is the short version of how the project accepts changes.

## Ways to help

| Type                               | What to do                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 🐛**Bug report**             | Open an issue with the simulator URL, the task ID (if applicable), the full command, and a Playwright trace or screenshot.             |
| 💡**Feature idea**           | Open a discussion first if it's non-trivial. We're happy to scope new directions but want to avoid one-off forks.                      |
| 📱**New app**                | Follow[docs/guides/add-an-app.md](docs/guides/add-an-app.md). PR title `feat(<appid>): add <DisplayName> app`.                          |
| 🧪**New task / suite**       | Follow[docs/guides/add-a-task.md](docs/guides/add-a-task.md). Every task must ship offline tests in `bench_env/tests/`.                 |
| 🤖**New agent adapter**      | Follow[docs/guides/add-an-agent.md](docs/guides/add-an-agent.md).                                                                         |
| 📊**Leaderboard submission** | Open a PR adding your row to the leaderboard table in[`README.md`](README.md), with the full run command and a link to public run logs. |
| 📝**Doc improvement**        | PRs welcome. Prefer fixing a specific error or filling a missing tutorial step over broad rewrites.                                    |

## Working with an AI assistant

All project conventions — file responsibilities, navigation declaration grammar, state model, OS service contracts, ban lists (no `new Date()`, no `useNavigate`, etc.) — are documented in [`AGENTS.md`](AGENTS.md) and the deeper references it links into under [`docs/platform/`](docs/platform/) and [`bench_env/docs/`](bench_env/docs/).

Any reasonable AI coding tool will pick this up automatically:

- **Claude Code** reads `CLAUDE.md` (which just points at `AGENTS.md`)
- **Codex / Antigravity / Cursor** read `AGENTS.md` directly


## Commit & PR style

- One logical change per PR. If the diff is mixed (refactor + feature + bugfix), split it.
- **Conventional commit prefixes** are encouraged but not mandatory: `feat(<app>): …`, `fix(<area>): …`, `refactor(os): …`, `docs(…)`, `test(…)`, `chore(…)`.
- Keep the PR description focused on **why** rather than **what** — the diff already shows what changed.
- Link the issue you're addressing: `Closes #123`.
- If your PR adds a new task or app, attach a screenshot or short clip of it working.

## Code of conduct

Be civil. Assume good faith. Disagreements are normal in research; ad-hominem isn't. Maintainers reserve the right to close threads that don't move the project forward.

## License

By submitting a contribution you agree that:

- Code is released under the project's **Apache License 2.0** ([LICENSE](LICENSE)).
- Bundled data and content are released under **CC BY-NC 4.0** ([LICENSE-DATA](LICENSE-DATA)).
- You have the right to license the contribution under these terms.

## Reporting takedown / rights claims

If you are a rights holder and want any asset removed, open an issue tagged `takedown`. See [DISCLAIMER.md](DISCLAIMER.md) for the full statement on trademarks and content provenance.

---

Thanks again. Every well-scoped contribution makes the platform more useful for the next person.
