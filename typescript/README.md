# XA Bank Time Deposits (TypeScript)

REST API on top of the existing time deposit domain logic: NestJS, PostgreSQL
and TypeORM, contract-first with OpenAPI, hexagonal layout, Testcontainers for
the integration tests.

## Prerequisites

- Node.js 20 or newer and Yarn 1 (`npm install --global yarn`)
- Docker (for the database and for the integration tests)

## Run it

```sh
yarn install
docker compose up -d --wait      # PostgreSQL on localhost:5432
yarn start                       # API on http://localhost:3000, applies migrations on start-up
```

Load the demo data (it covers every interest rule and resets both tables):

```sh
docker compose exec -T postgres psql -U postgres -d time_deposits -f /sample-data.sql
```

`yarn build && yarn start:prod` runs the compiled build instead of ts-node.

## Trigger the endpoints with Swagger

The contract lives in [`api/openapi.yaml`](api/openapi.yaml). The running
application serves exactly this file through Swagger UI at
<http://localhost:3000/swagger> (raw JSON: `/swagger-json`).

1. Open <http://localhost:3000/swagger>.
2. **GET /time-deposits**: _Try it out_, then _Execute_. Returns all deposits
   with `id`, `planType`, `balance`, `days` and `withdrawals`.
3. **POST /time-deposits/balance-updates**: _Try it out_, then _Execute_.
   Responds with `204 No Content` once one month of interest has been added to
   every deposit.
4. Run the GET again to see the new balances. With the demo data:

   | id  | plan    | days | before     | after      |
   | --- | ------- | ---- | ---------- | ---------- |
   | 1   | basic   | 20   | 10000.00   | 10000.00   |
   | 2   | basic   | 45   | 1234567.00 | 1235595.81 |
   | 3   | student | 200  | 5000.00    | 5012.50    |
   | 4   | student | 400  | 5000.00    | 5000.00    |
   | 5   | premium | 40   | 20000.00   | 20000.00   |
   | 6   | premium | 90   | 20000.00   | 20083.33   |

The same from the command line:

```sh
curl http://localhost:3000/time-deposits
curl -X POST -i http://localhost:3000/time-deposits/balance-updates
```

The Swagger contract can also be imported into Postman or Insomnia.

## Tests

```sh
yarn test              # unit tests, no Docker needed
yarn test:integration  # API and database tests against PostgreSQL in Testcontainers
yarn test:all          # both
yarn typecheck
yarn format:check
```

- `TimeDepositCalculator.test.ts` pins the behaviour of `updateBalance` with
  values captured from the original implementation.
- `TimeDepositCalculator.equivalence.test.ts` runs thousands of generated
  deposits through the refactored calculator and through a verbatim copy of the
  original one and requires bit-identical balances.
- `TimeDepositApi.test.ts` drives both endpoints over HTTP against a real
  database, validates the GET response against the OpenAPI schema and checks
  that a concurrent change to a balance is never overwritten.
- `DatabaseSchema.test.ts` checks the tables against the requirements and that
  the TypeORM mappings agree with the migrations.

## Configuration

| Variable      | Default         |
| ------------- | --------------- |
| `PORT`        | `3000`          |
| `DB_HOST`     | `localhost`     |
| `DB_PORT`     | `5432`          |
| `DB_USER`     | `postgres`      |
| `DB_PASSWORD` | `postgres`      |
| `DB_NAME`     | `time_deposits` |

The defaults match `docker-compose.yml`.

## Structure

```
api/openapi.yaml                 contract, source of truth for the HTTP API
src/
  TimeDeposit.ts                 shared class, unchanged
  TimeDepositCalculator.ts       same signature and results, now delegates to policies
  domain/
    interest/                    InterestPolicy, one policy per plan, InterestPolicies lookup
    Withdrawal.ts
  application/
    port/in/                     use cases called by the HTTP adapter
    port/out/                    TimeDepositRepository, implemented by the persistence adapter
    service/                     TimeDepositService
  adapter/
    in/http/                     controller, contract loading, types generated from the contract
    out/persistence/             TypeORM entities, repository, migrations
  TimeDepositModule.ts           composition root (the only place that wires Nest to the core)
  main.ts
```

Dependencies point inwards: adapters depend on the application ports, the
application depends on the domain, and neither the domain nor the application
imports Nest or TypeORM.

`TimeDeposit.ts` and `TimeDepositCalculator.ts` stay where they were, so existing
imports keep working.

## Design decisions and assumptions

- **No breaking changes.** `TimeDeposit` is untouched and `updateBalance(xs)`
  keeps its signature and its exact floating point results, rounding included.
  `new TimeDepositCalculator()` still works; the constructor optionally takes a
  different set of interest policies.
- **Extensible interest rules.** Each plan is an `InterestPolicy`. The 30 day
  rule shared by all current plans lives in `FixedRateInterestPolicy` and can be
  overridden by a future plan. Adding a plan means adding a policy and
  registering it in `InterestPolicies.default()`; the calculator does not change.
  Unknown plan types earn no interest, as before.
- **POST for the balance update.** Every call adds another month of interest, so
  the operation is not idempotent and PUT would be misleading. It is meant to be
  triggered once a month, for example by a scheduler.
- **Consistency.** The update runs in one transaction and locks the deposit rows
  (`SELECT ... FOR UPDATE`, in id order). Two overlapping calls are applied one
  after the other instead of losing an update. Changed balances are written with
  a single `UPDATE ... FROM unnest(...)` statement.
- **Withdrawals do not affect interest.** The requirements only ask to store and
  return them, and changing the calculation would change `updateBalance`.
- **`days` is not changed by the balance update.** It is the age of the deposit
  and is maintained outside this API.
- **Money.** Balances and amounts are `numeric(19,2)` in the database and plain
  JSON numbers in the API, matching the `number` used by the domain. Balances are
  stored rounded to cents, which only drops floating point noise because the
  calculator already rounds interest to cents.
- **Names.** Tables and columns use the camelCase names from the requirements
  (`timeDeposits`, `planType`, `timeDepositId`), so they are quoted in SQL.
- **Contract first.** `api/openapi.yaml` is written by hand, served as-is by
  Swagger UI, and the response types are generated from it
  (`yarn generate:api`). An integration test validates real responses against
  it.
- **Migrations run on start-up** to keep the setup to two commands. In a real
  deployment they would run as a separate step (`yarn migration:run`).
- **Loading all deposits at once** is fine at this scale. For large volumes the
  update would be processed in id-ordered batches.
- Input validation and error handling are out of scope, as the assignment says.

## AI-assisted development

Tools, configuration and the parts where AI was used are described in
[docs/ai-assisted-development.md](docs/ai-assisted-development.md); the agent rules
are in [CLAUDE.md](CLAUDE.md).

## Changes to the original project setup

- Tests run with ts-jest and the code is type-checked (`yarn typecheck`).
  Previously Babel only stripped the types, which hid a compile error in
  `src/index.ts`.
- The demo script `src/index.ts` is replaced by the application entry point
  `src/main.ts`.
- The committed `yarn-error.log` (with a private registry URL and local paths)
  is removed.
