import { getContract, parseEther } from 'viem'
import { publicClient, walletClient } from './client'
import { BANK_ADDRESS } from './config'
import bankABI from './abis/bankABI.json'

const bankContract = getContract({
  address: BANK_ADDRESS,
  abi: bankABI,
  client: {
    public: publicClient,
    wallet: walletClient,
  },
})

export async function getTotalEthDeposits() {
  return await bankContract.read.getTotalEthDeposits()
}

export async function getTotalGweiDeposits() {
  return await bankContract.read.getTotalGweiDeposits()
}

export async function getCollateralRatio() {
  return await bankContract.read.collateralRatio()
}

export async function getBorrowFee() {
  return await bankContract.read.borrowFee()
}

export async function getUserEthBalances(user: `0x${string}`) {
  return await bankContract.read.userEthBalances([user])
}

export async function getUserGweiBalances(user: `0x${string}`) {
  return await bankContract.read.userGweiBalances([user])
}

export async function getUserEthDebts(user: `0x${string}`) {
  return await bankContract.read.userEthDebts([user])
}

export async function getUserGweiDebts(user: `0x${string}`) {
  return await bankContract.read.userGweiDebts([user])
}

export async function getClaimableEthRewards(user: `0x${string}`) {
  return await bankContract.read.getClaimableEthRewards([user])
}

export async function getNetBalance(user: `0x${string}`) {
  return bankContract.read.getNetBalanceOf([user])
}

export async function depositEther(amount: string, account: `0x${string}`) {
  const { request } = await publicClient.simulateContract({
    address: BANK_ADDRESS,
    abi: bankABI,
    functionName: 'depositEther',
    args: [],
    value: parseEther(amount),
    account,
  })
  const hash = await walletClient.writeContract(request)
  return hash
}

export async function withdrawEther(amount: string, account: `0x${string}`) {
  const { request } = await publicClient.simulateContract({
    address: BANK_ADDRESS,
    abi: bankABI,
    functionName: 'withdrawEther',
    args: [parseEther(amount)],
    account,
  })
  const hash = await walletClient.writeContract(request)
  return hash
}

export async function depositGwei(amount: string, account: `0x${string}`) {
  const { request } = await publicClient.simulateContract({
    address: BANK_ADDRESS,
    abi: bankABI,
    functionName: 'depositGwei',
    args: [amount],
    account,
  })
  const hash = await walletClient.writeContract(request)
  return hash
}

export async function withdrawGwei(amount: string, account: `0x${string}`) {
  const { request } = await publicClient.simulateContract({
    address: BANK_ADDRESS,
    abi: bankABI,
    functionName: 'withdrawGwei',
    args: [amount],
    account,
  })
  const hash = await walletClient.writeContract(request)
  return hash
}
