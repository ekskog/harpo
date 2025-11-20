<script setup>
import { ref, onMounted } from 'vue';

const status = ref('Checking...');
const apiUrl = 'https://harp-api.ekskog.xyz/health';

async function checkBackendHealth() {
  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      const text = await response.text();
      status.value = text === 'OK' ? '✅ Backend Connected' : '⚠️ Unexpected Response';
    } else {
      status.value = `❌ Error: ${response.status}`;
    }
  } catch (error) {
    status.value = `❌ Failed: ${error.message}`;
  }
}

onMounted(() => {
  checkBackendHealth();
});
</script>

<template>
  <div class="p-4 bg-gray-100 rounded shadow text-center">
    <h2 class="text-xl font-semibold mb-2">Backend Health</h2>
    <p class="text-lg" :class="status.includes('✅') ? 'text-green-600' : 'text-red-600'">
      {{ status }}
    </p>
  </div>
</template>