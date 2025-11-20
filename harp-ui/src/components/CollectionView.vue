<template>
    <div class="mt-6">
      <div v-if="loading" class="text-gray-500">Loading collection...</div>
      <div v-else-if="error" class="text-red-600">{{ error }}</div>
      <div v-else-if="collection" class="space-y-6">
        <!-- Collection Details -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-3xl font-bold text-slate-800 mb-2">{{ collection.name }}</h2>
          <p v-if="collection.description" class="text-slate-600 mb-4">
            {{ collection.description }}
          </p>
          <p class="text-sm text-slate-500">
            Created: {{ formatDate(collection.created_at) }}
          </p>
        </div>
  
        <!-- Songs List -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-2xl font-bold mb-4 text-slate-800">
            Songs
            <span class="text-sm font-normal text-slate-500 ml-2">
              ({{ collection.songs.length }})
            </span>
          </h3>
          <div v-if="collection.songs.length === 0" class="text-gray-500 italic">
            No songs in this collection yet.
          </div>
          <ol v-else class="space-y-2">
            <li
              v-for="song in collection.songs"
              :key="song.id"
              class="flex items-center p-3 hover:bg-slate-50 rounded transition-colors"
            >
              <span class="text-slate-500 font-mono text-sm mr-4 min-w-[2rem]">
                {{ song.track_order || '—' }}
              </span>
              <span class="text-slate-800 font-medium">{{ song.title }}</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue';
  
  const props = defineProps({
    collectionId: {
      type: [Number, String],
      required: true
    }
  });
  
  const collection = ref(null);
  const loading = ref(false);
  const error = ref('');
  
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  async function fetchCollection() {
    if (!props.collectionId) return;
    
    loading.value = true;
    error.value = '';
    collection.value = null;
    
    try {
      const response = await fetch(`/api/collections/${props.collectionId}`);
      const contentType = response.headers.get('content-type') || '';
      
      if (response.ok && contentType.includes('application/json')) {
        collection.value = await response.json();
      } else if (response.status === 404) {
        error.value = 'Collection not found';
      } else {
        error.value = `Failed to load collection: ${await response.text()}`;
      }
    } catch (err) {
      error.value = `Failed to fetch collection: ${err.message}`;
    } finally {
      loading.value = false;
    }
  }
  
  // Watch for changes to collectionId and fetch collection
  watch(() => props.collectionId, () => {
    fetchCollection();
  }, { immediate: true });
  </script>