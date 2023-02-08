import { describe, it, expect } from 'vitest'

import { price } from './price'
import { Token } from './tokens'
import { dai, usdc } from './tokens/mainnet'

const ta = (token: Token, amount: number) => ({
  token,
  amount: BigInt(amount) * 10n ** token.decimals,
})

describe('#quote', () => {
  it('returns correct value', () => {
    const Usdc_Dai = price(ta(usdc, 1), ta(dai, 5))
    expect(Usdc_Dai.quote(ta(usdc, 10))).toEqual(ta(dai, 50))
  })
})
