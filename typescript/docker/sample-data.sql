-- Demo data covering every interest rule. Replaces whatever is in the tables.
-- The schema itself is created by the application migrations on start-up.
BEGIN;

TRUNCATE "withdrawals", "timeDeposits" RESTART IDENTITY;

INSERT INTO "timeDeposits" ("planType", "days", "balance") VALUES
  ('basic',   20,  10000.00),   -- first 30 days: no interest
  ('basic',   45,  1234567.00), -- 1% a year
  ('student', 200, 5000.00),    -- 3% a year
  ('student', 400, 5000.00),    -- older than a year: no interest
  ('premium', 40,  20000.00),   -- premium pays only after 45 days
  ('premium', 90,  20000.00);   -- 5% a year

INSERT INTO "withdrawals" ("timeDepositId", "amount", "date") VALUES
  (2, 1500.00, '2026-10-01'),
  (2, 250.50,  '2026-11-02'),
  (4, 100.00,  '2026-09-15');

COMMIT;
