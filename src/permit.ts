import { Token } from '@uniswap/sdk-core'
import { Interface } from '@ethersproject/abi'
// import ISelfPermit from '@uniswap/v3-periphery/artifacts/contracts/interfaces/ISelfPermit.sol/ISelfPermit.json'
// import { toHex } from './utils'
import { utils } from 'ethers'

const { hexValue } = utils

export interface StandardPermitArguments {
  v: 0 | 1 | 27 | 28
  r: string
  s: string
  amount: bigint | number
  deadline: bigint | number
}

export interface AllowedPermitArguments {
  v: 0 | 1 | 27 | 28
  r: string
  s: string
  nonce: bigint | number
  expiry: bigint | number
}

export type PermitOptions = StandardPermitArguments | AllowedPermitArguments

function isAllowedPermit(permitOptions: PermitOptions): permitOptions is AllowedPermitArguments {
  return 'nonce' in permitOptions
}

const INTERFACE: Interface = new Interface() // ISelfPermit.abi)
export function encodePermit(token: Token, options: PermitOptions) {
  return isAllowedPermit(options)
    ? INTERFACE.encodeFunctionData('selfPermitAllowed', [
        token.address,
        hexValue(options.nonce),
        hexValue(options.expiry),
        options.v,
        options.r,
        options.s,
      ])
    : INTERFACE.encodeFunctionData('selfPermit', [
        token.address,
        hexValue(options.amount),
        hexValue(options.deadline),
        options.v,
        options.r,
        options.s,
      ])
}
