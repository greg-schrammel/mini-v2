import { fraction } from './fraction'
import { findSwapInput, findSwapOutput, InsufficientInput, isSameToken, Pair } from './pair'
import { price, Price } from './price'
import { createRoute, Route } from './route'
import { Token } from './tokens'
import { Percent, TokenAmount } from './types'

const computePriceImpact = <Input extends Token, Output extends Token>(
  midPrice: Price<Input, Output>,
  input: TokenAmount<Input>,
  output: TokenAmount<Output>,
) => {
  const routeOutputAmount = midPrice.quote(input).amount
  return fraction(routeOutputAmount - output.amount, routeOutputAmount)
}

//   /**
//    * The swaps of the trade, i.e. which routes and how much is swapped in each that
//    * make up the trade. May consist of swaps in v2 or v3.
//    */
//   public readonly swaps: {
//     route: IRoute<TInput, TOutput, Pair | Pool>
//     inputAmount: CurrencyAmount<TInput>
//     outputAmount: CurrencyAmount<TOutput>
//   }[]

const computeRouteHopsOutcomes = <Input extends Token, Output extends Token>(
  route: Route<Input, Output>,
  exact: TokenAmount<Input | Output>,
) => {
  const tokenAmounts: TokenAmount[] = isSameToken(route.input, exact.token)
    ? route.pairs.map((pair, i) => findSwapOutput(pair, tokenAmounts[i]), [route.input])
    : route.pairs.map((pair, i) => findSwapInput(pair, tokenAmounts[i]), [route.output]).reverse()
  return tokenAmounts
}

const swap = <Input extends Token = Token, Output extends Token = Token>(
  route: Route<Input, Output>,
  exact: TokenAmount,
) => {
  const routeHopsOutcomes = computeRouteHopsOutcomes(route, exact)

  const inputAmount = routeHopsOutcomes[0]
  const outputAmount = routeHopsOutcomes.at(-1) as TokenAmount

  const executionPrice = price(inputAmount, outputAmount)
  const priceImpact = computePriceImpact(route.midPrice, inputAmount, outputAmount)

  return { executionPrice, priceImpact }
}

type SwapRouteInputOutput =
  | { input: TokenAmount; output: Token }
  | { input: Token; output: TokenAmount }
const findRoute = (pairs: Pair[], { input, output }: SwapRouteInputOutput) => {
  
}

const bestTradeExactIn = (
  pairs: Pair[],
  currencyAmountIn: TokenAmount,
  currencyOut: Token,
  { maxNumResults = 3, maxHops = 3 } = {},
  // used in recursion.
  currentPairs: Pair[] = [],
  nextAmountIn: TokenAmount = currencyAmountIn,
  bestTrades = [],
) => {
  // invariant(pairs.length > 0, 'PAIRS')
  // invariant(maxHops > 0, 'MAX_HOPS')
  // invariant(currencyAmountIn === nextAmountIn || currentPairs.length > 0, 'INVALID_RECURSION')

  const amountIn = nextAmountIn
  const tokenOut = currencyOut
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i]

    // pair irrelevant
    if (!pair.reserves.some((t) => isSameToken(t.token, amountIn.token))) continue
    if (pair.reserves.some((t) => t.amount === 0n)) continue

    let amountOut: TokenAmount
    try {
      amountOut = pairOutput(pair, amountIn)
    } catch (error) {
      if (error instanceof InsufficientInput) continue
      throw error
    }

    // we have arrived at the output token, so this is the final trade of one of the paths
    if (isSameToken(amountOut.token, tokenOut)) {
      const b = [
        ...bestTrades,
        swap(
          createRoute([...currentPairs, pair], {
            input: currencyAmountIn.token,
            output: currencyOut,
          }),
          currencyAmountIn,
        ),
      ].sort(tradeComparator)

      return b.slice(0, maxNumResults)
    } else if (maxHops > 1 && pairs.length > 1) {
      const pairsExcludingThisPair = pairs.slice(0, i).concat(pairs.slice(i + 1, pairs.length))

      // otherwise, consider all the other paths that lead from this token as long as we have not exceeded maxHops
      bestTradeExactIn(
        pairsExcludingThisPair,
        currencyAmountIn,
        currencyOut,
        {
          maxNumResults,
          maxHops: maxHops - 1,
        },
        [...currentPairs, pair],
        amountOut,
        bestTrades,
      )
    }
  }

  return bestTrades
}
