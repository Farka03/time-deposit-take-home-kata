# AI-assisted development

## Setup

- **Tool:** Claude Code with Claude Opus 5.5 (Anthropic) as the coding agent.
  It ran in a sandboxed Linux workspace with a shell, Node.js 22 and Docker, so
  it could install packages, run the tests and commit.
- **Configuration:** the rules in [`CLAUDE.md`](../CLAUDE.md), which Claude Code
  loads automatically. No other AI tools or plugins were used.
- **Reproducing it:** install Claude Code, start it in `typescript/` so it picks
  up `CLAUDE.md`, and give it a task. Its work is checked the same way as any
  other change: `yarn typecheck`, `yarn test` and `yarn test:integration`.

## How it was used

The agent wrote most of the code, tests and documentation. I set the task and
the constraints and made the decisions on stack and scope. It worked in small
steps: each step had to compile and pass the tests before it was committed on
its own.

The reason was not only speed. The agent ran checks I would often skip by hand,
for example capturing exact expected values from the original code or breaking
code on purpose to see whether a test notices.

## Some places where it made a difference

- **Proving the refactoring is safe.** Before touching the calculator, the agent
  captured the balances the original code produces and pinned them in tests.
  It also proposed the property-based test that compares the new calculator with
  a verbatim copy of the old one. To check that test, it swapped
  `(balance * rate) / 12` for `balance * (rate / 12)`, and the test failed on
  the first counterexample.
- **The concurrency test.** The first version (two parallel POST requests) still
  passed with the row lock removed, so it proved nothing. The agent found this by
  removing the lock and rewrote the test. Now another transaction holds the row,
  the test waits in `pg_stat_activity` until the API request blocks, then changes
  the balance. Without `FOR UPDATE` the test fails with the lost update (12010
  instead of 24020).
- **Unit and integration tests split.** The test count (56 instead of 45)
  showed that the negated `testMatch` pattern did not work, so `yarn test`
  silently needed Docker. Fixed with `testPathIgnorePatterns`.
- **Running Testcontainers in a restricted sandbox.** The sandbox could not pull
  images from Docker Hub. The agent built a local stand-in image from official
  PostgreSQL binaries just to run the integration tests there. The project
  itself uses the standard `postgres:16-alpine` image.
