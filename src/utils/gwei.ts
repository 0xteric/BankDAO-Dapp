import { getContract, parseEther, parseGwei, parseUnits } from 'viem'
import { publicClient, walletClient } from './client'
import { GIGAWEI_ADDRESS } from './config'
import gigaWeiABI from './abis/gigawei.json'

const gweiContract = getContract({
  address: GIGAWEI_ADDRESS,
  abi: gigaWeiABI,
  client: {
    public: publicClient,
    wallet: walletClient,
  },
})

export async function getGweiTotalSupply() {
  return await gweiContract.read.totalSupply()
}

export async function getGweiSymbol() {
  return await gweiContract.read.symbol()
}

export async function getGweiName() {
  return await gweiContract.read.name()
}

export async function getGweiBalanceOf(address: `0x${string}`) {
  return await gweiContract.read.balanceOf([address])
}

export async function getGweiAllowanceFor(address: `0x${string}`, contract: `0x${string}`) {
  return await gweiContract.read.allowance([address, contract])
}

export async function approveAllowance(account: `0x${string}`, contract: `0x${string}`, value: string) {
  const { request } = await publicClient.simulateContract({
    address: GIGAWEI_ADDRESS,
    abi: gigaWeiABI,
    account: account,
    args: [contract, value],
    functionName: 'approve',
  })
  const hash = walletClient.writeContract(request)
  return hash
}

export async function mint(account: `0x${string}`, amount: string) {
  console.log(amount)
  const { request } = await publicClient.simulateContract({
    address: GIGAWEI_ADDRESS,
    abi: gigaWeiABI,
    account: account,
    args: [account, amount],
    functionName: 'mint',
    value: parseGwei(amount),
  })
  const hash = walletClient.writeContract(request)
  return hash
}

export async function redeem(account: `0x${string}`, amount: string) {
  const { request } = await publicClient.simulateContract({
    address: GIGAWEI_ADDRESS,
    abi: gigaWeiABI,
    account: account,
    args: [amount],
    functionName: 'redeem',
  })
  const hash = walletClient.writeContract(request)
  return hash
}
