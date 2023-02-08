import { describe, it, expect } from 'vitest'

import { createPair } from './pair'
import { createRoute } from './route'
import { Token } from './tokens'
import { dai, usdc, usdt, weth } from './tokens/mainnet'

const ta = (token: Token, amount: number) => ({
  token,
  amount: BigInt(amount) * 10n ** token.decimals,
})

const pairs = [
  createPair({ reserves: [ta(usdc, 1), ta(dai, 1)] }),
  createPair({ reserves: [ta(dai, 1), ta(usdt, 1)] }),
  createPair({ reserves: [ta(usdt, 1), ta(weth, 1234)] }),
]

const route = createRoute(pairs, { input: usdc, output: weth })

describe('route', () => {
  it('path', () => {
    expect(route.path).toEqual([usdc, dai, usdt, weth])
  })

  it('#midPrice', () => {
    expect(route.midPrice.quote(ta(route.input, 1))).toEqual(ta(route.output, 1234))
    expect(route.midPrice.invert().quote(ta(route.output, 1234))).toEqual(ta(route.input, 1))
  })
})
