import { Token } from '.'

export const usdc: Token = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6n,
  chainId: 1,
}

export const dai: Token = {
  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  symbol: 'DAI',
  name: 'DAI Stablecoin',
  decimals: 18n,
  chainId: 1,
}

export const usdt: Token = {
  address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  symbol: 'USDT',
  name: 'USD Tether',
  decimals: 18n,
  chainId: 1,
}

export const weth: Token = {
  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  symbol: 'WETH',
  name: 'Wrapped Ether',
  decimals: 18n,
  chainId: 1,
}
