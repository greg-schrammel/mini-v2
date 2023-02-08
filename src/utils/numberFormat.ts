import { TokenAmount } from '../pair'
import { utils } from 'ethers'

const _format = (amount: bigint, decimals: bigint, options?: Intl.NumberFormatOptions) => {
  const f = Intl.NumberFormat('en-US', {
    maximumSignificantDigits: 6,
    minimumSignificantDigits: 3,
    ...options,
  })
  return f.format(+utils.formatUnits(amount, decimals))
}

export function format(amount: bigint, decimals: bigint, options?: Intl.NumberFormatOptions): string
export function format(amount: TokenAmount, options?: Intl.NumberFormatOptions): string

export function format(...args: unknown[]) {
  if (typeof args[0] === 'bigint') {
    const [amount, decimals, options] = args as [bigint, bigint, Intl.NumberFormatOptions]
    return _format(amount, decimals, options)
  }

  const [tokenAmount, options] = args as [TokenAmount, Intl.NumberFormatOptions]
  return _format(tokenAmount.amount, tokenAmount.token.decimals, options)
}
