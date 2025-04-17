<script setup>
import GigaWei from '../components/GigaWei.vue'
import { ref, onMounted, watch } from 'vue'
import { publicClient } from '../utils/client.ts'
import {
  getUserEthBalances,
  getUserGweiBalances,
  getUserEthDebts,
  getUserGweiDebts,
  getTotalEthDeposits,
  getTotalGweiDeposits,
  getCollateralRatio,
  getBorrowFee,
  getClaimableEthRewards,
  getNetBalance,
  depositEther,
  withdrawEther,
  depositGwei,
  withdrawGwei,
} from '../utils/bank.ts'
import { getGweiAllowanceFor, approveAllowance } from '@/utils/gwei.ts'
import { BANK_ADDRESS } from '@/utils/config.ts'
import { useAuthStore } from '../stores/auth.ts'

const auth = useAuthStore()

const userEthBalance = ref('-')
const userGweiBalance = ref('-')
const userEthDebt = ref('-')
const userGweiDebt = ref('-')
const userNetBalance = ref('-')

const totalEth = ref('-')
const totalGwei = ref('-')
const borrowFee = ref('-')
const collateralRatio = ref('-')

const depositActive = ref()
const depositAmount = ref()
const depositStatus = ref(0)
const withdrawActive = ref()
const withdrawAmount = ref()
const txStatus = ref(0)

const mustApprove = ref(false)

async function loadUserBalances() {
  const userAddress = auth.client[0]
  if (!userAddress) return
  const eth_b = await getUserEthBalances(userAddress)
  const gwei_b = await getUserGweiBalances(userAddress)
  const eth_d = await getUserEthDebts(userAddress)
  const gwei_d = await getUserGweiDebts(userAddress)
  const ethRewards = await getClaimableEthRewards(userAddress)
  const net = await getNetBalance(userAddress)

  userEthBalance.value = eth_b > 0 ? Number(eth_b) / 1e18 : 0
  userGweiBalance.value = gwei_b > 0 ? Number(gwei_b) : 0
  userEthDebt.value = eth_d > 0 ? Number(eth_d) / 1e18 : 0
  userGweiDebt.value = gwei_d > 0 ? Number(gwei_d) : 0
  userNetBalance.value = net > 0 ? Number(net) / 1e18 : 0
}

async function loadGlobalData() {
  const eth = await getTotalEthDeposits()
  const gwei = await getTotalGweiDeposits()
  const fee = await getBorrowFee()
  const ratio = await getCollateralRatio()

  borrowFee.value = Number(fee) / 100
  collateralRatio.value = Number(ratio) / 100
  totalEth.value = Number(eth) / 1e18
  totalGwei.value = gwei
}

async function deposit() {
  if (!depositAmount.value || depositAmount.value <= 0) alert('Add amount to deposit!')
  let hash, receipt
  txStatus.value = 1
  if (depositActive.value == 'ether') {
    hash = await depositEther(depositAmount.value, auth.client[0])
  } else {
    hash = await depositGwei(depositAmount.value, auth.client[0])
  }
  receipt = await publicClient.waitForTransactionReceipt({
    hash,
  })
  if (receipt.status == 'success') {
    txStatus.value = 2
  } else {
    txStatus.value = 3
  }
  setTimeout(() => {
    txStatus.value = 0
    depositAmount.value = null
    closeDeposit()
    loadUserBalances()
    loadGlobalData()
  }, 2000)
}

async function getGweiAllowance() {
  const amount = await getGweiAllowanceFor(auth.client[0], BANK_ADDRESS)
  return amount
}

async function approveSpending() {
  const hash = await approveAllowance(auth.client[0], BANK_ADDRESS, depositAmount.value)
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  })
  if (receipt.status == 'success') {
    mustApprove.value = false
  }
}

async function checkMustApprove() {
  const approved = await getGweiAllowance()
  console.log(approved)
  if (approved >= depositAmount.value) {
    mustApprove.value = false
  } else {
    mustApprove.value = true
  }
}

async function withdraw() {
  if (!withdrawAmount.value || withdrawAmount.value <= 0) alert('Add amount to withdraw!')
  txStatus.value = 1
  let hash, receipt
  if (withdrawActive.value == 'ether') {
    hash = await withdrawEther(withdrawAmount.value, auth.client[0])
  } else {
    hash = await withdrawGwei(withdrawAmount.value, auth.client[0])
  }

  receipt = await publicClient.waitForTransactionReceipt({
    hash,
  })
  if (receipt.status == 'success') {
    txStatus.value = 2
  } else {
    txStatus.value = 3
  }
  setTimeout(() => {
    txStatus.value = 0
    closeDeposit()
    loadUserBalances()
    loadGlobalData()
  }, 2000)
  console.log(hash)
}

function closeDeposit() {
  depositActive.value = null
}

function closeWithdraw() {
  withdrawActive.value = null
}

function closeDepositFromBG(event) {
  if (event.target.id == 'd_bg') depositActive.value = null
}

function closeWithdrawFromBG(event) {
  if (event.target.id == 'w_bg') withdrawActive.value = null
}

function handleDepositInput() {
  if (depositActive.value == 'giga wei') {
    checkMustApprove()
  }
}

watch(
  () => auth.client,
  () => {
    loadUserBalances()
  },
)

onMounted(() => {
  loadGlobalData()
  loadUserBalances()
})
</script>

<template>
  <main>
    <div class="py-2 flex items-center">
      <div>
        <GigaWei></GigaWei>
      </div>
      <div></div>
    </div>
    <div id="balances-table">
      <div class="table-head">
        <span class="strong">Assets</span>
        <span class="amount-col strong">Total deposits</span>
        <span class="amount-col strong">Your deposits</span>
        <span class="amount-col strong">Your borrows</span>
        <span class="amount-col strong"></span>
      </div>
      <div class="table-row">
        <span>ETH</span>
        <span class="amount-col">{{ totalEth }}</span>
        <div class="amount-col">
          <span>{{ userEthBalance }} </span>
          <button @click="depositActive = 'ether'" class="d_btn">Deposit</button>
        </div>
        <div class="amount-col">
          <span>{{ userEthDebt }} </span>
          <button class="b_btn">Borrow</button>
        </div>

        <div class="actions-div">
          <button @click="withdrawActive = 'ether'" class="w_btn">Withdraw</button>
        </div>
      </div>
      <div class="table-row">
        <span>GWEI</span>
        <span class="amount-col">{{ totalGwei }}</span>
        <div class="amount-col">
          <span>{{ userGweiBalance }}</span>
          <button @click="depositActive = 'giga wei'" class="d_btn">Deposit</button>
        </div>
        <div class="amount-col">
          <span>{{ userGweiDebt }}</span>
          <button class="b_btn">Borrow</button>
        </div>
        <div class="actions-div">
          <button @click="withdrawActive = 'giga wei'" class="w_btn">Withdraw</button>
        </div>
      </div>
      <div class="info justify-between w-full">
        <div class="flex gap-[10px]">
          <div class="flex gap-2">
            <span>Collateral ratio:</span>
            <strong>{{ collateralRatio }}%</strong>
          </div>
          <div class="flex gap-2 ml-4">
            <span>Borrow fee:</span>
            <strong>{{ borrowFee }}%</strong>
          </div>
        </div>
        <div>
          <span
            >Net: <strong>{{ userNetBalance }} ETH</strong></span
          >
        </div>
      </div>
    </div>
  </main>
  <div @click="closeDepositFromBG" id="d_bg" class="deposit-bg" v-if="depositActive">
    <div class="deposit-div p-2 rounded-[10px]">
      <div class="text-[var(--text)] justify-between p-2">
        <h3>Deposit {{ depositActive }}</h3>
        <i @click="closeDeposit" class="fi fi-rr-cross flex hover:opacity-70 hover:cursor-pointer"></i>
      </div>
      <input @input="handleDepositInput" v-model="depositAmount" type="text" class="p-2 focus:outline-none bg-[var(--component-dark)] rounded text-[var(--text)]" placeholder="0.0" />
      <button v-if="depositStatus == 0 && !mustApprove" @click="deposit" class="p-2 bg-[var(--component)] text-[var(--text)] rounded hover:cursor-pointer hover:opacity-70">Deposit</button>
      <button v-if="depositStatus == 0 && mustApprove" @click="approveSpending" class="p-2 bg-[var(--component)] text-[var(--text)] rounded hover:cursor-pointer hover:opacity-70">Approve</button>
      <button v-else-if="depositStatus == 1" class="p-3 bg-[var(--component)] text-[var(--text)] rounded hover:cursor-pointer hover:opacity-70 flex justify-center">
        <i class="fi fi-rr-loading rotate flex w-min h-min"></i>
      </button>
      <button v-else-if="depositStatus == 2" class="p-3 bg-[var(--component)] text-[var(--text)] rounded hover:cursor-pointer hover:opacity-70 flex justify-center">
        <i class="fi fi-rr-check flex w-min h-min"></i>
      </button>
      <button v-else-if="depositStatus == 3" class="p-3 bg-[var(--component)] text-[var(--text)] rounded hover:cursor-pointer hover:opacity-70 flex justify-center">
        <i class="fi fi-rr-cross flex w-min h-min"></i>
      </button>
    </div>
  </div>
  <div @click="closeWithdrawFromBG" id="w_bg" class="deposit-bg" v-if="withdrawActive">
    <div class="deposit-div p-2 rounded-[10px]">
      <div class="text-[var(--text)] justify-between p-2">
        <h3>Withdraw {{ withdrawActive }}</h3>
        <i @click="closeWithdraw" class="fi fi-rr-cross flex hover:opacity-70 hover:cursor-pointer"></i>
      </div>
      <input v-model="withdrawAmount" type="text" class="p-2 focus:outline-none bg-[var(--component-dark)] rounded text-[var(--text)]" placeholder="0.0" />
      <button v-if="txStatus == 0" @click="withdraw" class="p-2 bg-[var(--component)] text-[var(--text)] rounded hover:cursor-pointer hover:opacity-70">Withdraw</button>
      <button v-else-if="txStatus == 1" class="p-3 bg-[var(--component)] text-[var(--text)] rounded hover:cursor-pointer hover:opacity-70 flex justify-center">
        <i class="fi fi-rr-loading rotate flex w-min h-min"></i>
      </button>
      <button v-else-if="txStatus == 2" class="p-3 bg-[var(--component)] text-[var(--text)] rounded hover:cursor-pointer hover:opacity-70 flex justify-center">
        <i class="fi fi-rr-check flex w-min h-min"></i>
      </button>
      <button v-else-if="txStatus == 3" class="p-3 bg-[var(--component)] text-[var(--text)] rounded hover:cursor-pointer hover:opacity-70 flex justify-center">
        <i class="fi fi-rr-cross flex w-min h-min"></i>
      </button>
    </div>
  </div>
</template>
<style scoped>
@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.amount-col {
  display: flex;
  justify-content: space-between;
  text-align: center;
  align-items: center;
  margin: 0 10px;
}
.rotate {
  animation: rotate 2s linear infinite;
}

.deposit-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 100;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.deposit-div {
  box-shadow: 0 0 20px 2px rgba(9, 10, 15, 0.219);
  background-color: var(--bg);
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.deposit-div > div {
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
}
.info {
  border-top: 1px solid rgb(205, 205, 205);
  display: flex;
  padding: 10px 0 0 0;
  gap: 15px;
  font-size: 12px;
}
.info > div {
  display: flex;
  gap: 5px;
}
.actions-div {
  justify-content: end;
  display: flex;
  gap: 10px;
}

main {
  color: var(--text);
  margin-top: 20px;
  width: 100%;
}

.d_btn {
  padding: 4px 18px;
  border-radius: 5px;
  border: 2px solid var(--light-text);
  background-color: var(--light-text);
  border: none;
  color: var(--component);
}
.b_btn {
  border-radius: 5px;
  padding: 4px 18px;
  border: 2px solid var(--light-text);
  color: var(--light-text);
  background-color: transparent;
}
.strong {
  font-weight: bold;
}
#balances-table {
  color: var(--text);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 10px;
  border-radius: 10px;
  background-color: var(--component);
}
.table-row {
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid rgb(205, 205, 205);
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  gap: 15px;
}
.table-row > * {
  flex: 1;
  padding: 0 2%;
}
.table-head {
  display: flex;
  width: 100%;
  justify-content: space-between;
  flex-direction: row;
  padding: 10px 0;
  gap: 15px;
}
.table-head > * {
  flex: 1;
  text-align: center;
}
.d_btn:hover,
.w_btn:hover,
.b_btn:hover {
  opacity: 0.7;
  cursor: pointer;
}
.w_btn {
  color: var(--light-text);
}
</style>
