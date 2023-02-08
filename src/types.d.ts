export type Address = string
export type TokenAmount<T extends Token = Token> = { token: T; amount: bigint }

/**
 * percent in bips (30 = 0.3%, 100 = 1%, ...)
 */
export type Percent = bigint | number
