import { TradeType, validateAndParseAddress } from '@uniswap/sdk-core'
import { PermitOptions } from './permit'
import { Percent } from './types'
import { ExtractAbiFunctionNames } from 'abitype'

import { UniV2Router } from './abis/UniV2Router'

/** Options for producing the arguments to send calls to the router. */
export interface SwapOptions {
  /** How much the execution price is allowed to move unfavorably from the execution price. */
  slippageTolerance: Percent
  /** The account that should receive the output. If omitted, output is sent to msg.sender. */
  recipient?: string
  /** Either deadline (when the transaction expires, in epoch seconds), or previousBlockhash. */
  deadlineOrPreviousBlockhash?: bigint | string
  /** The optional permit parameters for spending the input. */
  inputTokenPermit?: PermitOptions
  /** Optional information for taking a fee on output. */
  // fee?:   ---- feeOnTransfer ?
}

/** The parameters to use in the call to the Uniswap V2 Router to execute a trade. */
export interface SwapParameters {
  /** The method to call on the Uniswap V2 Router. */
  methodName: ExtractAbiFunctionNames<typeof UniV2Router>
  /** The arguments to pass to the method, all hex encoded. */
  args: (string | string[])[]
  /** The amount of wei to send in hex. */
  value: string
}

function swapCallParameters(trade, options: SwapOptions): SwapParameters {
  const etherIn = trade.inputAmount.currency.isNative
  const etherOut = trade.outputAmount.currency.isNative
  // the router does not support both ether in and out
  invariant(!(etherIn && etherOut), 'ETHER_IN_OUT')

  const to: string = validateAndParseAddress(options.recipient)
  const amountIn: string = toHex(trade.maximumAmountIn(options.allowedSlippage))
  const amountOut: string = toHex(trade.minimumAmountOut(options.allowedSlippage))
  const path: string[] = trade.route.path.map((token: Token) => token.address)
  const deadline =
    'ttl' in options
      ? `0x${(Math.floor(new Date().getTime() / 1000) + options.ttl).toString(16)}`
      : `0x${options.deadline.toString(16)}`

  const useFeeOnTransfer = Boolean(options.feeOnTransfer)

  let methodName: SwapParameters['methodName']
  let args: (string | string[])[]
  let value: string
  switch (trade.tradeType) {
    case TradeType.EXACT_INPUT:
      if (etherIn) {
        methodName = useFeeOnTransfer
          ? 'swapExactETHForTokensSupportingFeeOnTransferTokens'
          : 'swapExactETHForTokens'
        // (uint amountOutMin, address[] calldata path, address to, uint deadline)
        args = [amountOut, path, to, deadline]
        value = amountIn
      } else if (etherOut) {
        methodName = useFeeOnTransfer
          ? 'swapExactTokensForETHSupportingFeeOnTransferTokens'
          : 'swapExactTokensForETH'
        // (uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        args = [amountIn, amountOut, path, to, deadline]
        value = ZERO_HEX
      } else {
        methodName = useFeeOnTransfer
          ? 'swapExactTokensForTokensSupportingFeeOnTransferTokens'
          : 'swapExactTokensForTokens'
        // (uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        args = [amountIn, amountOut, path, to, deadline]
        value = ZERO_HEX
      }
      break
    case TradeType.EXACT_OUTPUT:
      invariant(!useFeeOnTransfer, 'EXACT_OUT_FOT')
      if (etherIn) {
        methodName = 'swapETHForExactTokens'
        // (uint amountOut, address[] calldata path, address to, uint deadline)
        args = [amountOut, path, to, deadline]
        value = amountIn
      } else if (etherOut) {
        methodName = 'swapTokensForExactETH'
        // (uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        args = [amountOut, amountIn, path, to, deadline]
        value = ZERO_HEX
      } else {
        methodName = 'swapTokensForExactTokens'
        // (uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        args = [amountOut, amountIn, path, to, deadline]
        value = ZERO_HEX
      }
      break
  }
  return {
    methodName,
    args,
    value,
  }
}
