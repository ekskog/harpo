<script setup>
import { ref, onMounted } from 'vue';
import HealthChecker from './components/HealthChecker.vue';

const collections = ref([]);
const selectedCollection = ref('');
const loading = ref(true);
const error = ref('');

async function fetchCollections() {
  try {
    const response = await fetch('/api/collections');
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      collections.value = await response.json();
      loading.value = false;
    } else {
      error.value = `Unexpected response: ${await response.text()}`;
    }
  } catch (err) {
    error.value = `Failed to fetch collections: ${err.message}`;
  }
}

onMounted(() => {
  fetchCollections();
});
</script>

<template>
  <div class="container mx-auto p-6">
    <HealthChecker />

    <div class="mt-6">
      <h2 class="text-xl font-semibold mb-2">Select a Collection</h2>

      <div v-if="loading" class="text-gray-500">Loading collections...</div>
      <div v-else-if="error" class="text-red-600">{{ error }}</div>
      <div v-else>
        <select
          v-model="selectedCollection"
          class="border rounded p-2 w-full"
        >
          <option disabled value="">-- Choose a collection --</option>
          <option
            v-for="collection in collections"
            :key="collection.id"
            :value="collection.id"
          >
            {{ collection.name }}
          </option>
        </select>

        <div v-if="selectedCollection" class="mt-4 text-gray-700">
          Selected Collection ID: {{ selectedCollection }}
        </div>
      </div>
    </div>
  </div>
</template>