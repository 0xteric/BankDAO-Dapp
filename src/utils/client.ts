import { createPublicClient, createWalletClient, http, custom } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

export const bankChain = arbitrumSepolia

export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http('https://arbitrum-sepolia.drpc.org'),
})

export const walletClient = createWalletClient({
  chain: arbitrumSepolia,
  transport: custom(window.ethereum),
})
