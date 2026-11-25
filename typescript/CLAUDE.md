# Working rules for the coding agent

Claude Code loads this file automatically when started in `typescript/`.

## Constraints from the assignment

- Do not change `src/TimeDeposit.ts`, the signature of
  `TimeDepositCalculator.updateBalance` or its results. Any change to the
  calculator must keep `TimeDepositCalculator.test.ts` and
  `TimeDepositCalculator.equivalence.test.ts` green.
- The API has exactly two endpoints. Do not add more.
- Input validation and error handling are out of scope.

## How to work

- Pin existing behaviour with a test before refactoring it.
- Contract first: change `api/openapi.yaml`, run `yarn generate:api`, then the code.
- Keep `domain/` and `application/` free of Nest and TypeORM. Wiring belongs in
  `TimeDepositModule.ts`.
- After writing a test, break the behaviour it protects once and confirm the
  test fails.
- One logical change per commit. Every commit must type-check and pass the tests.
- Commit messages explain why, not only what. No generated footers.

## Before committing

```sh
yarn typecheck
yarn format:check
yarn test
yarn test:integration   # when persistence, HTTP or the contract changed (needs Docker)
```
