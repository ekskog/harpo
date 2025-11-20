<script setup>
import { ref, onMounted, computed } from 'vue';

const backendStatus = ref('Checking...');
const headersInfo = ref('Loading...');
const isHealthy = computed(() => backendStatus.value.includes('✅'));

const healthUrl = '/api/health'; // Vite proxy
const debugUrl = '/api/debug/headers';

async function checkBackendHealth() {
  try {
    const response = await fetch(healthUrl);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await response.json();
      backendStatus.value = json.status === 'ok'
        ? '✅ Backend Connected'
        : `⚠️ Unexpected Response: ${JSON.stringify(json)}`;
    } else {
      const text = await response.text();
      backendStatus.value = `⚠️ Unexpected Response: ${text}`;
    }
  } catch (error) {
    backendStatus.value = `❌ Failed: ${error.message}`;
  }
}

async function fetchDebugHeaders() {
  try {
    const response = await fetch(debugUrl);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await response.json();
      headersInfo.value = JSON.stringify(json, null, 2);
    } else {
      const text = await response.text();
      headersInfo.value = `Non-JSON response:\n${text}`;
    }
  } catch (error) {
    headersInfo.value = `Error fetching headers: ${error.message}`;
  }
}

onMounted(() => {
  checkBackendHealth();
//  fetchDebugHeaders();
});
</script>

<template>
  <div class="w-full px-6 py-4 flex flex-wrap items-center justify-between text-sm text-white">
    <span class="uppercase tracking-wide text-slate-300">System Status</span>
    <p class="text-base font-semibold" :class="isHealthy ? 'text-green-300' : 'text-red-300'">
      {{ backendStatus }}
    </p>

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