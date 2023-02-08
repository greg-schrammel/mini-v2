import { TokenAmount } from './types'
import { Token } from './tokens'
import { isSameToken } from './pair'
import { Fraction, fraction } from './fraction'

export type Price<Base extends Token = Token, Quote extends Token = Token> = {
  baseToken: Base
  quoteToken: Quote
  exchangeRate: Fraction
  quote: (quoteAmount: TokenAmount<Base>) => TokenAmount<Quote>
  invert: () => Price<Quote, Base>
}

/* represents the exchange rate between two tokens (base/quote = EUR/USD or 1 EUR = x USD) */
export const price = <Base extends Token, Quote extends Token>(
  base: TokenAmount<Base>,
  _quote: TokenAmount<Quote>,
): Price<Base, Quote> => {
  const exchangeRate = fraction(_quote.amount, base.amount) // 1 base = x quote

  const quote = (baseAmountToBeQuoted: TokenAmount<Base>) => {
    if (!isSameToken(baseAmountToBeQuoted.token, base.token)) throw 'token'
    return {
      token: _quote.token,
      amount: (baseAmountToBeQuoted.amount * exchangeRate.d) / exchangeRate.n,
    }
  }

  return {
    baseToken: base.token,
    quoteToken: _quote.token,
    exchangeRate,
    quote,
    invert: () => price(_quote, base),
  }
}
