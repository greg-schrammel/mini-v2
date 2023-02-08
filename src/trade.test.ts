import { describe, it, expect } from 'vitest'

import JSBI from 'jsbi'
import { Token as UToken, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core'
import { createPair } from './pair'
import { Pair, Trade, Route } from '@uniswap/v2-sdk'
import { TokenAmount } from './types'

const token0 = new UToken(1, '0x0000000000000000000000000000000000000001', 18, 't0')
const token1 = new UToken(1, '0x0000000000000000000000000000000000000002', 18, 't1')
const token2 = new UToken(1, '0x0000000000000000000000000000000000000003', 18, 't2')
const token3 = new UToken(1, '0x0000000000000000000000000000000000000004', 18, 't3')

const pair_0_1 = new Pair(
  CurrencyAmount.fromRawAmount(token0, 1000),
  CurrencyAmount.fromRawAmount(token1, 1000),
)
// const pair_0_2 = new Pair(
//   CurrencyAmount.fromRawAmount(token0, 1000),
//   CurrencyAmount.fromRawAmount(token2, 1100),
// )
// const pair_0_3 = new Pair(
//   CurrencyAmount.fromRawAmount(token0, 1000),
//   CurrencyAmount.fromRawAmount(token3, 900),
// )
const pair_1_2 = new Pair(
  CurrencyAmount.fromRawAmount(token1, 1200),
  CurrencyAmount.fromRawAmount(token2, 1000),
)
// const pair_1_3 = new Pair(
//   CurrencyAmount.fromRawAmount(token1, 1200),
//   CurrencyAmount.fromRawAmount(token3, 1300),
// )
// const empty_pair_0_1 = new Pair(
//   CurrencyAmount.fromRawAmount(token0, 0),
//   CurrencyAmount.fromRawAmount(token1, 0),
// )

// const ta = (token: Token, amount: bigint): TokenAmount => ({ token: token as Token, amount })
// const new_pair_0_1 = createPair({ reserves: [ta(token0, 1000n), ta(token1, 1000n)] })
// const new_pair_0_2 = createPair({ reserves: [ta(token0, 1000n), ta(token2, 1100n)] })
// const new_pair_0_3 = createPair({ reserves: [ta(token0, 1000n), ta(token3, 900n)] })
// const new_pair_1_2 = createPair({ reserves: [ta(token1, 1200n), ta(token2, 1000n)] })
// const new_pair_1_3 = createPair({ reserves: [ta(token1, 1200n), ta(token3, 1300n)] })

describe('tradeType = EXACT_OUTPUT', () => {
  const exactOut = new Trade(
    new Route([pair_0_1, pair_1_2], token0, token2),
    CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(100)),
    TradeType.EXACT_INPUT,
  )

  it('throws if less than 0', () => {
    expect(() => exactOut.maximumAmountIn(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
      'SLIPPAGE_TOLERANCE',
    )
  })
  it('returns exact if 0', () => {
    expect(exactOut.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
      exactOut.inputAmount,
    )
  })
  it('returns slippage amount if nonzero', () => {
    expect(exactOut.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
      CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(156)),
    )
    expect(exactOut.maximumAmountIn(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
      CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(163)),
    )
    expect(exactOut.maximumAmountIn(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
      CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(468)),
    )
  })
})

// describe('#bestTradeExactIn', () => {
//   it('throws with empty pairs', () => {
//     expect(() =>
//       Trade.bestTradeExactIn([], CurrencyAmount.fromRawAmount(token0, 100), token2),
//     ).toThrow('PAIRS')
//   })
//   it('throws with max hops of 0', () => {
//     expect(() =>
//       Trade.bestTradeExactIn([pair_0_2], CurrencyAmount.fromRawAmount(token0, 100), token2, {
//         maxHops: 0,
//       }),
//     ).toThrow('MAX_HOPS')
//   })

//   it('provides best route', () => {
//     const result = Trade.bestTradeExactIn(
//       [pair_0_1, pair_0_2, pair_1_2],
//       CurrencyAmount.fromRawAmount(token0, 100),
//       token2,
//     )
//     expect(result).toHaveLength(2)
//     expect(result[0].route.pairs).toHaveLength(1) // 0 -> 2 at 10:11
//     expect(result[0].route.path).toEqual([token0, token2])
//     expect(result[0].inputAmount).toEqual(CurrencyAmount.fromRawAmount(token0, 100))
//     expect(result[0].outputAmount).toEqual(CurrencyAmount.fromRawAmount(token2, 99))
//     expect(result[1].route.pairs).toHaveLength(2) // 0 -> 1 -> 2 at 12:12:10
//     expect(result[1].route.path).toEqual([token0, token1, token2])
//     expect(result[1].inputAmount).toEqual(CurrencyAmount.fromRawAmount(token0, 100))
//     expect(result[1].outputAmount).toEqual(CurrencyAmount.fromRawAmount(token2, 69))
//   })

//   it('doesnt throw for zero liquidity pairs', () => {
//     expect(
//       Trade.bestTradeExactIn([empty_pair_0_1], CurrencyAmount.fromRawAmount(token0, 100), token1),
//     ).toHaveLength(0)
//   })

//   it('respects maxHops', () => {
//     const result = Trade.bestTradeExactIn(
//       [pair_0_1, pair_0_2, pair_1_2],
//       CurrencyAmount.fromRawAmount(token0, 10),
//       token2,
//       { maxHops: 1 },
//     )
//     expect(result).toHaveLength(1)
//     expect(result[0].route.pairs).toHaveLength(1) // 0 -> 2 at 10:11
//     expect(result[0].route.path).toEqual([token0, token2])
//   })

//   it('insufficient input for one pair', () => {
//     const result = Trade.bestTradeExactIn(
//       [pair_0_1, pair_0_2, pair_1_2],
//       CurrencyAmount.fromRawAmount(token0, 1),
//       token2,
//     )
//     expect(result).toHaveLength(1)
//     expect(result[0].route.pairs).toHaveLength(1) // 0 -> 2 at 10:11
//     expect(result[0].route.path).toEqual([token0, token2])
//     expect(result[0].outputAmount).toEqual(CurrencyAmount.fromRawAmount(token2, 1))
//   })

//   it('respects n', () => {
//     const result = Trade.bestTradeExactIn(
//       [pair_0_1, pair_0_2, pair_1_2],
//       CurrencyAmount.fromRawAmount(token0, 10),
//       token2,
//       { maxNumResults: 1 },
//     )

//     expect(result).toHaveLength(1)
//   })

//   it('no path', () => {
//     const result = Trade.bestTradeExactIn(
//       [pair_0_1, pair_0_3, pair_1_3],
//       CurrencyAmount.fromRawAmount(token0, 10),
//       token2,
//     )
//     expect(result).toHaveLength(0)
//   })

//   //   it('works for ETHER currency input', () => {
//   //     const result = Trade.bestTradeExactIn(
//   //       [pair_weth_0, pair_0_1, pair_0_3, pair_1_3],
//   //       CurrencyAmount.fromRawAmount(Ether.onChain(1), 100),
//   //       token3,
//   //     )
//   //     expect(result).toHaveLength(2)
//   //     expect(result[0].inputAmount.currency).toEqual(ETHER)
//   //     expect(result[0].route.path).toEqual([WETH9[1], token0, token1, token3])
//   //     expect(result[0].outputAmount.currency).toEqual(token3)
//   //     expect(result[1].inputAmount.currency).toEqual(ETHER)
//   //     expect(result[1].route.path).toEqual([WETH9[1], token0, token3])
//   //     expect(result[1].outputAmount.currency).toEqual(token3)
//   //   })
//   //   it('works for ETHER currency output', () => {
//   //     const result = Trade.bestTradeExactIn(
//   //       [pair_weth_0, pair_0_1, pair_0_3, pair_1_3],
//   //       CurrencyAmount.fromRawAmount(token3, 100),
//   //       ETHER,
//   //     )
//   //     expect(result).toHaveLength(2)
//   //     expect(result[0].inputAmount.currency).toEqual(token3)
//   //     expect(result[0].route.path).toEqual([token3, token0, WETH9[1]])
//   //     expect(result[0].outputAmount.currency).toEqual(ETHER)
//   //     expect(result[1].inputAmount.currency).toEqual(token3)
//   //     expect(result[1].route.path).toEqual([token3, token1, token0, WETH9[1]])
//   //     expect(result[1].outputAmount.currency).toEqual(ETHER)
//   //   })
// })
