<script setup>
import { publicClient, walletClient } from '@/utils/client'
import { ref, onMounted } from 'vue'
import { getGweiTotalSupply, getGweiBalanceOf, mint, redeem } from '@/utils/gwei'
import { useAuthStore } from '@/stores/auth'

let auth = useAuthStore()

const totalSupply = ref('-')
const userGweiBalance = ref('-')
const userEthBalance = ref('-')
const mintValue = ref()
const redeemValue = ref()

async function loadGweiData() {
  const supply = await getGweiTotalSupply()
  totalSupply.value = supply
  const userB = await getGweiBalanceOf(auth.client[0])
  userGweiBalance.value = userB
  const userNative = await publicClient.getBalance({
    address: auth.client[0],
  })
  userEthBalance.value = (Number(userNative) / 1e18).toFixed(4)
}

async function mintGwei() {
  if (!mintValue.value || mintValue.value <= 0) alert('Add valid values to mint!')
  const hash = await mint(auth.client[0], mintValue.value)
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  })
  if (receipt.status == 'success') {
    loadGweiData()
  } else {
    alert('Tx failed!')
  }
}

async function redeemGwei() {
  if (!redeemValue.value || redeemValue.value <= 0) alert('Add valid values to mint!')
  const hash = await redeem(auth.client[0], redeemValue.value)
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  })
  if (receipt.status == 'success') {
    loadGweiData()
  } else {
    alert('Tx failed!')
  }
}

onMounted(() => {
  setTimeout(() => {
    loadGweiData()
  }, 3000)
})
</script>

<template>
  <div class="flex flex-col rounded-[10px] gap-2 bg-[var(--component)] p-2">
    <h3 class="text-xl font-bold">Giga wei</h3>
    <div class="flex gap-4">
      <div class="flex flex-col gap-2">
        <div class="flex items-center rounded overflow-hidden">
          <div class="relative">
            <input v-model="mintValue" type="text" class="focus:outline-none bg-[var(--component-dark)] p-1 w-[150px]" placeholder="0.0" />
            <span @click="mintValue = String(userEthBalance * 1e9)" class="absolute right-1 top-2 text-[10px] hover:cursor-pointer opacity-70 hover:opacity-90">{{ userEthBalance }} MAX</span>
          </div>
          <button @click="mintGwei" class="text-center p-1 bg-[var(--light-text)] flex-1 text-[var(--component-dark)] hover:opacity-70 hover:cursor-pointer">Mint</button>
        </div>
        <div class="flex flex-col">
          <div class="flex items-center rounded overflow-hidden">
            <div class="relative">
              <input v-model="redeemValue" type="text" class="focus:outline-none bg-[var(--component-dark)] p-1 w-[150px]" placeholder="0.0" />
              <span @click="redeemValue = String(userGweiBalance)" class="absolute right-1 top-2 text-[10px] hover:cursor-pointer opacity-70 hover:opacity-90">{{ userGweiBalance }} MAX</span>
            </div>

            <button @click="redeemGwei" class="text-center p-1 bg-[var(--light-text)] flex-1 text-[var(--component-dark)] hover:opacity-70 hover:cursor-pointer">Redeem</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
