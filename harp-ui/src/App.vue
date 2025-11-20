<template>
  <div class="min-h-screen flex flex-col bg-slate-100 text-slate-900">
    <!-- Main Content -->
    <main class="flex-1 w-full max-w-3xl mx-auto px-6 py-10">
      <!-- Dropdown -->
      <div v-if="loading" class="text-gray-500">Loading collections...</div>
      <div v-else-if="error" class="text-red-600">{{ error }}</div>
      <div v-else>
        <div class="bg-white rounded-lg shadow-md p-6">
          <label for="collection-select" class="block text-sm font-medium text-slate-700 mb-2">
            Select a Collection
          </label>
          <select
            id="collection-select"
            v-model="selectedCollection"
            class="border border-slate-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-slate-500 focus:border-transparent"
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
        </div>
        
        <!-- Collection View Component -->
        <CollectionView v-if="selectedCollection" :collection-id="selectedCollection" />
      </div>
    </main>

    <!-- Sticky Footer -->
    <footer class="mt-auto w-full bg-slate-950 text-white border-t border-slate-800">
      <HealthChecker />
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import HealthChecker from './components/HealthChecker.vue';
import CollectionView from './components/CollectionView.vue';

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