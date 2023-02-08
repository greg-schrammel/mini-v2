// import { pack, keccak256 } from '@ethersproject/solidity'
// import { getCreate2Address } from '@ethersproject/address'

import { Token } from './tokens'
import { Address, Percent, TokenAmount } from './types'

// import { INIT_CODE_HASH } from '../../constants'
// import { BigintIsh, CurrencyAmount, Price } from '@uniswap/sdk-core'
// import invariant from 'tiny-invariant'
// import { InsufficientInputAmountError, InsufficientReservesError } from 'errors'
// import { sqrt } from 'utils'
// import { Pair } from 'entities/pair'

const sortAddresses = (addresses: Address[]) =>
  addresses.sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))
// const sortTokens = (tokens: Token[]) =>
// tokens.sort((a, b) => (a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1))
const sortTokenAmounts = (tokenAmounts: [TokenAmount, TokenAmount]): [TokenAmount, TokenAmount] =>
  tokenAmounts.sort((a, b) =>
    a.token.address.toLowerCase() < b.token.address.toLowerCase() ? -1 : 1,
  )

export const computePairAddress = (factoryAddress: Address, reserves: Address[]): string => {
  const [token0, token1] = sortAddresses(reserves)
  return ''
  // return getCreate2Address(
  //   factoryAddress,
  //   keccak256(['bytes'], [pack(['address', 'address'], [token0, token1])]),
  //   INIT_CODE_HASH
  // )
}

export type Pair = {
  token: Token
  fee: Percent
  reserves: [TokenAmount, TokenAmount]
}

const bips = 10_000n

export class InsufficientReserves extends Error {}
export class InsufficientInput extends Error {}

export const isSameToken = (t1: Token, t2: Token) =>
  t1.address === t2.address && t1.chainId === t2.chainId

const createLPToken = (factory: Address, reserves: TokenAmount[]): Token => {
  if (reserves[0].token.chainId !== reserves[1].token.chainId)
    throw 'all tokens must be on same chain'
  // todo
  return {
    address: computePairAddress(
      factory,
      reserves.map((r) => r.token.address),
    ),
    name: 'LP',
    symbol: 'LP',
    decimals: 18n,
    chainId: reserves[0].token.chainId,
  }
}

type CreatePairArgs = Partial<Pair> & { reserves: Pair['reserves'] }
export const createPair = (pair: CreatePairArgs): Pair => {
  return {
    fee: 30n,
    ...pair,
    token: pair.token || createLPToken('0x00', pair.reserves),
    reserves: sortTokenAmounts(pair.reserves),
  }
}

export const sortReserves = (
  reserves: Pair['reserves'],
  sortByToken: Token,
): [TokenAmount, TokenAmount] => {
  const i = reserves.findIndex((r) => isSameToken(r.token, sortByToken))
  console.log(
    reserves.map((r) => r.token.symbol),
    sortByToken.symbol,
  )
  if (i === -1) throw 'token not in reserves'
  return [reserves[i], reserves.at(i - 1) as TokenAmount]
}

const updatePairReserves = (pair: Pair, amountIn: TokenAmount, amountOut: TokenAmount) => {
  const [tokenInReserves, tokenOutReserves] = sortReserves(pair.reserves, amountIn.token)
  return createPair({
    ...pair,
    reserves: [
      { token: amountIn.token, amount: tokenInReserves.amount + amountIn.amount },
      { token: amountOut.token, amount: tokenOutReserves.amount - amountOut.amount },
    ],
  })
}

export const findSwapOutput = (pair: Pair, input: TokenAmount) => {
  // invariant(this.involvesToken(inputAmount.currency), 'TOKEN')
  if (pair.reserves.every((r) => r.amount === 0n)) throw new InsufficientReserves()

  const [inputTokenReserve, outputTokenReserve] = sortReserves(pair.reserves, input.token)

  const inputAmountAfterFee = input.amount - (input.amount * BigInt(pair.fee)) / bips

  const outputAmount =
    (inputAmountAfterFee * outputTokenReserve.amount) /
    (inputTokenReserve.amount + inputAmountAfterFee)

  if (outputAmount === 0n) throw new InsufficientInput()

  const output = { token: outputTokenReserve.token, amount: outputAmount }
  const newPair = updatePairReserves(pair, input, output)

  return output
}

export const findSwapInput = (pair: Pair, output: TokenAmount) => {
  const [outputTokenReserve, inputTokenReserve] = sortReserves(pair.reserves, output.token)

  if (pair.reserves.every((r) => r.amount === 0n) || output.amount >= inputTokenReserve.amount)
    throw new InsufficientReserves()

  const inputAmount =
    (inputTokenReserve.amount * output.amount * bips) /
      ((outputTokenReserve.amount - output.amount) * (bips - BigInt(pair.fee))) +
    1n

  const input = { token: inputTokenReserve.token, amount: inputAmount }
  const newPair = updatePairReserves(pair, input, output)

  return input
}

// const liquidityMinted = (
//   totalSupply: CurrencyAmount<Token>,
//   tokenAmountA: CurrencyAmount<Token>,
//   tokenAmountB: CurrencyAmount<Token>
// ): CurrencyAmount<Token> => {
//   invariant(totalSupply.currency.equals(this.liquidityToken), 'LIQUIDITY')
//   const tokenAmounts = tokenAmountA.currency.sortsBefore(tokenAmountB.currency) // does safety checks
//     ? [tokenAmountA, tokenAmountB]
//     : [tokenAmountB, tokenAmountA]
//   invariant(tokenAmounts[0].currency.equals(this.token0) && tokenAmounts[1].currency.equals(this.token1), 'TOKEN')

//   let liquidity: BigInt
//   if (totalSupply.quotient === BigInt(0)) {
//     liquidity = BigInt(Math.sqrt(tokenAmounts[0].quotient * tokenAmounts[1].quotient)) - BigInt(MINIMUM_LIQUIDITY)
//   } else {
//     const amount0 = (tokenAmounts[0].quotient * totalSupply.quotient) / this.reserve0.quotient
//     const amount1 = (tokenAmounts[1].quotient * totalSupply.quotient) / this.reserve1.quotient
//     liquidity = amount0 <= amount1 ? amount0 : amount1
//   }
//   if (liquidity <= BigInt(0)) {
//     throw new InsufficientInputAmountError()
//   }

//   return CurrencyAmount.fromRawAmount(this.liquidityToken, liquidity)
// }

// export class Pair {
//   public readonly liquidityToken: Token
//   private readonly tokenAmounts: [CurrencyAmount<Token>, CurrencyAmount<Token>]

//   public static getAddress(tokenA: Token, tokenB: Token): string {
//     return computePairAddress({ factoryAddress: FACTORY_ADDRESS, tokenA: tokenA.address, tokenB: tokenB.address })
//   }

//   public constructor(currencyAmountA: CurrencyAmount<Token>, tokenAmountB: CurrencyAmount<Token>) {
//     const tokenAmounts = currencyAmountA.currency.sortsBefore(tokenAmountB.currency) // does safety checks
//       ? [currencyAmountA, tokenAmountB]
//       : [tokenAmountB, currencyAmountA]
//     this.liquidityToken = new Token(
//       tokenAmounts[0].currency.chainId,
//       Pair.getAddress(tokenAmounts[0].currency, tokenAmounts[1].currency),
//       18,
//       'UNI-V2',
//       'Uniswap V2'
//     )
//     this.tokenAmounts = tokenAmounts as [CurrencyAmount<Token>, CurrencyAmount<Token>]
//   }

//   /**
//    * Returns true if the token is either token0 or token1
//    * @param token to check
//    */
//   public involvesToken(token: Token): boolean {
//     return token.equals(this.token0) || token.equals(this.token1)
//   }

//   /**
//    * Returns the current mid price of the pair in terms of token0, i.e. the ratio of reserve1 to reserve0
//    */
//   public get token0Price(): Price<Token, Token> {
//     const result = this.tokenAmounts[1].divide(this.tokenAmounts[0])
//     return new Price(this.token0, this.token1, result.denominator, result.numerator)
//   }

//   /**
//    * Returns the current mid price of the pair in terms of token1, i.e. the ratio of reserve0 to reserve1
//    */
//   public get token1Price(): Price<Token, Token> {
//     const result = this.tokenAmounts[0].divide(this.tokenAmounts[1])
//     return new Price(this.token1, this.token0, result.denominator, result.numerator)
//   }

//   /**
//    * Return the price of the given token in terms of the other token in the pair.
//    * @param token token to return price of
//    */
//   public priceOf(token: Token): Price<Token, Token> {
//     invariant(this.involvesToken(token), 'TOKEN')
//     return token.equals(this.token0) ? this.token0Price : this.token1Price
//   }

//   /**
//    * Returns the chain ID of the tokens in the pair.
//    */
//   public get chainId(): number {
//     return this.token0.chainId
//   }

//   public get token0(): Token {
//     return this.tokenAmounts[0].currency
//   }

//   public get token1(): Token {
//     return this.tokenAmounts[1].currency
//   }

//   public get reserve0(): CurrencyAmount<Token> {
//     return this.tokenAmounts[0]
//   }

//   public get reserve1(): CurrencyAmount<Token> {
//     return this.tokenAmounts[1]
//   }

//   public reserveOf(token: Token): CurrencyAmount<Token> {
//     invariant(this.involvesToken(token), 'TOKEN')
//     return token.equals(this.token0) ? this.reserve0 : this.reserve1
//   }

//   public getOutputAmount(inputAmount: CurrencyAmount<Token>): [CurrencyAmount<Token>, Pair] {
//     invariant(this.involvesToken(inputAmount.currency), 'TOKEN')

//     //   if (Object.values(pool.reserves).every(r => r === 0n)) throw new InsufficientReserves()
//     if (BigInt(this.reserve0.quotient.toString()) === 0n || BigInt(this.reserve1.quotient.toString()) === 0n) {
//       throw new InsufficientReservesError()
//     }

//     const inputReserve = pool.reserves[tokenIn]
//     const outputReserve = pool.reserves[tokenOut]

//     const inputAmountAfterFee = amount - (amount * pool.fee) / bips

//     const outputAmount = (inputAmountAfterFee * outputReserve) / (inputReserve + inputAmountAfterFee)

//     if (outputAmount === 0n) throw new InsufficientInput()

//     //   pool.reserves[tokenIn] += amount
//     //   pool.reserves[tokenOut] -= outputAmount

//     return [outputAmount, pool]

//     if (JSBI.equal(this.reserve0.quotient, ZERO) || JSBI.equal(this.reserve1.quotient, ZERO)) {
//       throw new InsufficientReservesError()
//     }
//     const inputReserve = this.reserveOf(inputAmount.currency)
//     const outputReserve = this.reserveOf(inputAmount.currency.equals(this.token0) ? this.token1 : this.token0)
//     const inputAmountWithFee = JSBI.multiply(inputAmount.quotient, _997)
//     const numerator = JSBI.multiply(inputAmountWithFee, outputReserve.quotient)
//     const denominator = JSBI.add(JSBI.multiply(inputReserve.quotient, _1000), inputAmountWithFee)
//     const outputAmount = CurrencyAmount.fromRawAmount(
//       inputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
//       JSBI.divide(numerator, denominator)
//     )
//     if (JSBI.equal(outputAmount.quotient, ZERO)) {
//       throw new InsufficientInputAmountError()
//     }
//     return [outputAmount, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount))]
//   }

//   public getInputAmount(outputAmount: CurrencyAmount<Token>): [CurrencyAmount<Token>, Pair] {
//     invariant(this.involvesToken(outputAmount.currency), 'TOKEN')
//     if (
//       JSBI.equal(this.reserve0.quotient, ZERO) ||
//       JSBI.equal(this.reserve1.quotient, ZERO) ||
//       JSBI.greaterThanOrEqual(outputAmount.quotient, this.reserveOf(outputAmount.currency).quotient)
//     ) {
//       throw new InsufficientReservesError()
//     }

//     const outputReserve = this.reserveOf(outputAmount.currency)
//     const inputReserve = this.reserveOf(outputAmount.currency.equals(this.token0) ? this.token1 : this.token0)
//     const numerator = JSBI.multiply(JSBI.multiply(inputReserve.quotient, outputAmount.quotient), _1000)
//     const denominator = JSBI.multiply(JSBI.subtract(outputReserve.quotient, outputAmount.quotient), _997)
//     const inputAmount = CurrencyAmount.fromRawAmount(
//       outputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
//       JSBI.add(JSBI.divide(numerator, denominator), ONE)
//     )
//     return [inputAmount, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount))]
//   }

//   public getLiquidityMinted(
//     totalSupply: CurrencyAmount<Token>,
//     tokenAmountA: CurrencyAmount<Token>,
//     tokenAmountB: CurrencyAmount<Token>
//   ): CurrencyAmount<Token> {
//     invariant(totalSupply.currency.equals(this.liquidityToken), 'LIQUIDITY')
//     const tokenAmounts = tokenAmountA.currency.sortsBefore(tokenAmountB.currency) // does safety checks
//       ? [tokenAmountA, tokenAmountB]
//       : [tokenAmountB, tokenAmountA]
//     invariant(tokenAmounts[0].currency.equals(this.token0) && tokenAmounts[1].currency.equals(this.token1), 'TOKEN')

//     let liquidity: JSBI
//     if (JSBI.equal(totalSupply.quotient, ZERO)) {
//       liquidity = JSBI.subtract(
//         sqrt(JSBI.multiply(tokenAmounts[0].quotient, tokenAmounts[1].quotient)),
//         MINIMUM_LIQUIDITY
//       )
//     } else {
//       const amount0 = JSBI.divide(JSBI.multiply(tokenAmounts[0].quotient, totalSupply.quotient), this.reserve0.quotient)
//       const amount1 = JSBI.divide(JSBI.multiply(tokenAmounts[1].quotient, totalSupply.quotient), this.reserve1.quotient)
//       liquidity = JSBI.lessThanOrEqual(amount0, amount1) ? amount0 : amount1
//     }
//     if (!JSBI.greaterThan(liquidity, ZERO)) {
//       throw new InsufficientInputAmountError()
//     }
//     return CurrencyAmount.fromRawAmount(this.liquidityToken, liquidity)
//   }

//   public getLiquidityValue(
//     token: Token,
//     totalSupply: CurrencyAmount<Token>,
//     liquidity: CurrencyAmount<Token>,
//     feeOn: boolean = false,
//     kLast?: BigintIsh
//   ): CurrencyAmount<Token> {
//     invariant(this.involvesToken(token), 'TOKEN')
//     invariant(totalSupply.currency.equals(this.liquidityToken), 'TOTAL_SUPPLY')
//     invariant(liquidity.currency.equals(this.liquidityToken), 'LIQUIDITY')
//     invariant(JSBI.lessThanOrEqual(liquidity.quotient, totalSupply.quotient), 'LIQUIDITY')

//     let totalSupplyAdjusted: CurrencyAmount<Token>
//     if (!feeOn) {
//       totalSupplyAdjusted = totalSupply
//     } else {
//       invariant(!!kLast, 'K_LAST')
//       const kLastParsed = JSBI.BigInt(kLast)
//       if (!JSBI.equal(kLastParsed, ZERO)) {
//         const rootK = sqrt(JSBI.multiply(this.reserve0.quotient, this.reserve1.quotient))
//         const rootKLast = sqrt(kLastParsed)
//         if (JSBI.greaterThan(rootK, rootKLast)) {
//           const numerator = JSBI.multiply(totalSupply.quotient, JSBI.subtract(rootK, rootKLast))
//           const denominator = JSBI.add(JSBI.multiply(rootK, FIVE), rootKLast)
//           const feeLiquidity = JSBI.divide(numerator, denominator)
//           totalSupplyAdjusted = totalSupply.add(CurrencyAmount.fromRawAmount(this.liquidityToken, feeLiquidity))
//         } else {
//           totalSupplyAdjusted = totalSupply
//         }
//       } else {
//         totalSupplyAdjusted = totalSupply
//       }
//     }

//     return CurrencyAmount.fromRawAmount(
//       token,
//       JSBI.divide(JSBI.multiply(liquidity.quotient, this.reserveOf(token).quotient), totalSupplyAdjusted.quotient)
//     )
//   }
// }
