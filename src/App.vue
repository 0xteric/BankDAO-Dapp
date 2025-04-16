<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref, onMounted } from 'vue'
import { walletClient, publicClient, bankChain } from './utils/client.ts'
import { useAuthStore } from './stores/auth.ts'

const auth = useAuthStore()
const userBalance = ref()
const userShortAddress = ref()

async function connectClient() {
  auth.client = await walletClient.requestAddresses()
  loadClientSession()
}

async function loadClientSession() {
  const accounts = await walletClient.getAddresses()
  console.log(accounts)
  if (!accounts[0]) return
  auth.client = accounts
  // const signature = await walletClient.signMessage({
  //   account: auth.client[0],
  //   message: 'Thanks for testing my dapp!',
  // })

  const clientChainId = await walletClient.getChainId()
  if (clientChainId != bankChain.id) {
    await walletClient.switchChain({ id: bankChain.id })
  }
  userShortAddress.value = `${auth.client[0].slice(0, 6)}...${auth.client[0].slice(38, 42)}`
  const balance = await publicClient.getBalance({
    address: auth.client[0],
  })
  userBalance.value = (Number(balance) / 1e18).toFixed(4)
}
onMounted(() => {
  loadClientSession()
})
</script>

<template>
  <header>
    <div>
      <div>
        <img src="./assets/icons/eter.png" alt="" />
      </div>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/dao">DAO</RouterLink>
      </nav>
      <div id="client-header-div">
        <button v-if="!userShortAddress" @click="connectClient">Connect</button>
        <div v-else id="client-data">
          <span>{{ userBalance }} ETH</span>
          <span>{{ userShortAddress }}</span>
        </div>
      </div>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
img {
  width: 30px;
}
header {
  display: flex;
  align-items: center;
  border-radius: 10px;
  width: 100%;
  background-color: var(--component-dark);
}
header > * {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 10px;
  width: 100%;
}
header > * > * {
  display: flex;
  flex: 1;
}
nav {
  justify-content: center;
  color: var(--text);
  gap: 1rem;
}
#client-header-div {
  color: var(--text);
  display: flex;
  justify-content: end;
}
#client-data {
  padding: 6px 14px;
  border-radius: 5px;
  background-color: var(--component);
  font-size: 13px;
  display: flex;
  flex-direction: row;
  gap: 10px;
}
button {
  background-color: var(--component);
  border: none;
  color: var(--text);
  border-radius: 5px;
  padding: 6px 18px;
}
button:hover {
  color: var(--light-text);
  cursor: pointer;
}
nav a {
  color: inherit;
  text-decoration: none;
}
nav a:hover {
  color: var(--light-text);
  text-decoration: none;
}
</style>
