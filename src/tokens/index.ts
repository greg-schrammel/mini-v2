export type Token = {
  address: string
  name: string
  symbol: string
  decimals: bigint
  totalSupply?: bigint
  chainId: number
}
