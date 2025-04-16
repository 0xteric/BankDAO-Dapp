<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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
} from '../utils/bank.ts'
import { useAuthStore } from '../stores/auth.ts'

const auth = useAuthStore()

const userEthBalance = ref('-')
const userGweiBalance = ref('-')
const userEthDebt = ref('-')
const userGweiDebt = ref('-')
const totalEth = ref('-')
const totalGwei = ref('-')
const borrowFee = ref('-')
const collateralRatio = ref('-')
const depositActive = ref()
const depositAmount = ref()
const depositOngoing = ref(false)
const depositSuccess = ref(false)

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
  if (depositActive.value == 'ether') {
    depositOngoing.value = true
    const hash = await depositEther(depositAmount.value, auth.client[0])
    depositOngoing.value = false
    depositSuccess.value = true
    setTimeout(() => {
      depositSuccess.value = false
      closeDeposit()
      loadUserBalances()
      loadGlobalData()
    }, 2000)
    console.log(hash)
  } else {
    console.log('No existe jajjajaj')
  }
}

function closeDeposit() {
  depositActive.value = null
}

function closeDepositFromBG(event) {
  if (event.target.id == 'd_bg') depositActive.value = null
}

watch(
  () => auth.client,
  () => {
    loadUserBalances()
  },
)

onMounted(() => {
  loadUserBalances()
  loadGlobalData()
})
</script>

<template>
  <main>
    <div id="balances-table">
      <div class="table-head">
        <span class="strong">Assets</span>
        <span class="amount-col strong">Total deposits</span>
        <span class="amount-col strong">Your deposits</span>
        <span class="amount-col strong">Your borrows</span>
        <span></span>
      </div>
      <div class="table-row">
        <span>ETH</span>
        <span class="amount-col">{{ totalEth }}</span>
        <span class="amount-col">{{ userEthBalance }}</span>
        <span class="amount-col">{{ userEthDebt }}</span>
        <div class="actions-div">
          <button @click="depositActive = 'ether'" class="d_btn">Deposit</button>
          <button class="b_btn">Borrow</button>
        </div>
      </div>
      <div class="table-row">
        <span>GWEI</span>
        <span class="amount-col">{{ totalGwei }}</span>
        <span class="amount-col">{{ userGweiBalance }}</span>
        <span class="amount-col">{{ userGweiDebt }}</span>
        <div class="actions-div">
          <button @click="depositActive = 'giga wei'" class="d_btn">Deposit</button>
          <button class="b_btn">Borrow</button>
        </div>
      </div>
      <div class="info">
        <div>
          <span>Collateral ratio:</span>
          <strong>{{ collateralRatio }}%</strong>
        </div>
        <div></div>
        <div>
          <span>Borrow fee:</span>
          <strong>{{ borrowFee }}%</strong>
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
      <input v-model="depositAmount" type="text" class="p-2 focus:outline-none bg-[var(--component-dark)] rounded text-[var(--text)]" placeholder="0.0" />
      <button v-if="!depositOngoing && !depositSuccess" @click="deposit" class="p-2 bg-[var(--component)] text-[var(--text)] rounded hover:cursor-pointer hover:opacity-70">Deposit</button>
      <button v-else-if="depositOngoing && !depositSuccess" class="p-3 bg-[var(--component)] text-[var(--text)] rounded hover:cursor-pointer hover:opacity-70 flex justify-center">
        <i class="fi fi-rr-loading rotate flex w-min h-min"></i>
      </button>
      <button v-else class="p-3 bg-[var(--component)] text-[var(--text)] rounded hover:cursor-pointer hover:opacity-70 flex justify-center">
        <i class="fi fi-rr-check flex w-min h-min"></i>
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
.actions-div > button:hover {
  opacity: 0.7;
  cursor: pointer;
}
main {
  color: var(--text);
  margin-top: 50px;
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
}
.amount-col {
  text-align: center;
}
</style>
