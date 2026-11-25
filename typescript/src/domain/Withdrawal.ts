export interface Withdrawal {
  readonly id: number
  readonly amount: number
  /** Calendar date in ISO format (YYYY-MM-DD), without time zone. */
  readonly date: string
}
