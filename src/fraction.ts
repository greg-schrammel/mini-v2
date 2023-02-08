type FractionOperations = {
  mul: (f: Fraction) => Fraction
  div: (f: Fraction) => Fraction
}
export type Fraction = { n: bigint; d: bigint } & FractionOperations

const fractionOperations = ({ n, d }: Pick<Fraction, 'n' | 'd'>): FractionOperations => ({
  mul: (f: Fraction) => fraction(n * f.n, d * f.d),
  div: (f: Fraction) => fraction(n * f.d, d * f.n),
})
export const fraction = (n: bigint | number, d: bigint | number = 1n): Fraction => ({
  n: BigInt(n),
  d: BigInt(d),
  ...fractionOperations({ n: BigInt(n), d: BigInt(d) }),
})
