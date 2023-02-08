import { fraction } from './fraction'
import { Pair, isSameToken, sortReserves } from './pair'
import { Price, price } from './price'
import { Token } from './tokens'

export type Route<Input extends Token = Token, Output extends Token = Token> = {
  pairs: Pair[]
  path: Token[]
  /** route end price, without considering swap fees */
  midPrice: Price<Input, Output>
  input: Input
  output: Output
}

export const createRoute = (pairs: Pair[], { input, output }: { input: Token; output: Token }) => {
  if (pairs.some((pair) => pair.token.chainId !== pairs[0].token.chainId))
    throw 'all pairs should be on the same chain'

  if (!pairs[0].reserves.some((r) => isSameToken(r.token, input)))
    throw 'input token not found in first pair'

  if (!pairs.at(-1)?.reserves.some((r) => isSameToken(r.token, output)))
    throw 'output token not found in last pair'

  const path: Token[] = pairs.reduce(
    (_path, { reserves: [r0, r1] }, i) => [
      ..._path,
      isSameToken(r0.token, _path[i]) ? r1.token : r0.token,
    ],
    [input],
  )

  const { n, d } = pairs.reduce((_midPrice, pair, i) => {
    const [base, quote] = sortReserves(pair.reserves, path[i])
    return _midPrice.mul(fraction(quote.amount, base.amount))
  }, fraction(1))

  const midPrice = price({ token: input, amount: n }, { token: output, amount: d })

  return { pairs, path, input, output, midPrice }
}
