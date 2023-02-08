import { describe, it, expect } from 'vitest'

import { createPair, findSwapOutput, findSwapInput } from './pair'
import { dai, usdc } from './tokens/mainnet'

const pair = createPair({
  fee: 30n,
  reserves: [
    { token: usdc, amount: 1_000_000n * 10n ** usdc.decimals },
    { token: dai, amount: 1_000_000n * 10n ** dai.decimals },
  ],
})

describe('Pair', () => {
  it('calculate swap output from a given input', () => {
    const input = { token: dai, amount: 100n * 10n ** dai.decimals }
    const output = findSwapOutput(pair, input)
    const contractCallResponse = 99690060n
    expect(output.amount).eq(contractCallResponse)
  })

  it('calculate input for a desired output', () => {
    const desiredOutput = { token: usdc, amount: 100n * 10n ** usdc.decimals }
    const input = findSwapInput(pair, desiredOutput)
    const contractCallResponse = 100310933801504523572n
    expect(input.amount).eq(contractCallResponse)
  })
})
