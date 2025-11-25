<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { healthApi } from '../services/api.js'

const { isAuthenticated, user, logout } = useAuth()

const backendStatus = ref('Checking...')
const headersInfo = ref('Loading...')
const isHealthy = computed(() => backendStatus.value.includes('✅'))

async function checkBackendHealth() {
  try {
    const result = await healthApi.check()
    backendStatus.value = result.status === 'healthy' && result.database?.connected === true
      ? '✅ Backend Connected'
      : `⚠️ Unexpected Response: ${JSON.stringify(result)}`
  } catch (error) {
    backendStatus.value = `❌ Failed: ${error.message}`
  }
}

async function fetchDebugHeaders() {
  try {
    const result = await healthApi.debugHeaders()
    headersInfo.value = JSON.stringify(result, null, 2)
  } catch (error) {
    headersInfo.value = `Error fetching headers: ${error.message}`
  }
}

function handleLogout() {
  logout()
}

onMounted(() => {
  checkBackendHealth()
  // fetchDebugHeaders()
})
</script>

<template>
  <div class="w-full px-6 py-4 flex flex-wrap items-center justify-between text-sm text-black">
    <span class="uppercase tracking-wide text-black">System Status</span>
    <div class="flex items-center space-x-4">
      <p class="text-base font-semibold" :class="isHealthy ? 'text-green-600' : 'text-red-600'">
        {{ backendStatus }}
      </p>

      <!-- Auth Status -->
      <div class="flex items-center space-x-2">
        <span v-if="isAuthenticated" class="text-black">
          Logged in as {{ user.username }}
        </span>
        <button
          @click="isAuthenticated ? handleLogout() : $emit('show-login')"
          class="p-2 rounded-md hover:bg-slate-200 transition-colors text-black"
          :title="isAuthenticated ? 'Logout' : 'Login'"
        >
          <svg
            v-if="isAuthenticated"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <svg
            v-else
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>

    <!--
    <div class="mt-4 text-left">
      <h3 class="font-semibold mb-2">Debug Headers:</h3>
      <pre class="bg-gray-200 p-2 rounded text-sm overflow-auto max-h-64">
        {{ headersInfo }}
      </pre>
    </div>
  -->
  </div>
</template>