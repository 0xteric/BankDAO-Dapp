import { createPublicClient, createWalletClient, http, custom } from 'viem'
import { sepolia } from 'viem/chains'

export const bankChain = sepolia

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
})

export const walletClient = createWalletClient({
  chain: sepolia,
  transport: custom(window.ethereum),
})
