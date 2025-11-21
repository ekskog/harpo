<template>
    <div class="mt-6">
      <div v-if="loading" class="text-gray-500">Loading collection...</div>
      <div v-else-if="error" class="text-red-600">{{ error }}</div>
      <div v-else-if="collection" class="space-y-6">
        <!-- Collection Details -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-3xl font-bold text-slate-800 mb-2">{{ collection.name }}</h2>
              <p v-if="collection.description" class="text-slate-600 mb-4">
                {{ collection.description }}
              </p>
              <p class="text-sm text-slate-500">
                Created: {{ formatDate(collection.created_at) }}
              </p>
            </div>
            <button
              v-if="isAuthenticated"
              @click="showAddSong = true"
              class="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
            >
              + Add Song
            </button>
          </div>
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
              class="flex items-center justify-between p-3 hover:bg-slate-50 rounded transition-colors"
            >
              <div class="flex items-center">
                <span class="text-slate-500 font-mono text-sm mr-4 min-w-[2rem]">
                  {{ song.track_order || '—' }}
                </span>
                <span class="text-slate-800 font-medium">{{ song.title }}</span>
              </div>
              <button
                v-if="isAuthenticated"
                @click="deleteSong(song.id)"
                class="text-red-600 hover:text-red-800 p-1"
                title="Delete song"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          </ol>
        </div>
      </div>

      <!-- Add Song Modal -->
      <AddSongModal
        :show="showAddSong"
        :collection-id="collectionId"
        @close="showAddSong = false"
        @song-added="handleSongAdded"
      />
    </div>
  </template>

  <script setup>
  import { ref, watch } from 'vue';
  import { useAuth } from '../composables/useAuth.js';
  import AddSongModal from './AddSongModal.vue';

  const props = defineProps({
    collectionId: {
      type: [Number, String],
      required: true
    },
    collection: {
      type: Object,
      default: null
    }
  });

  const emit = defineEmits(['refresh-collections']);

  const { isAuthenticated, getAuthHeaders } = useAuth();

  const collection = ref(null);
  const loading = ref(false);
  const error = ref('');
  const showAddSong = ref(false);

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
    if (!props.collectionId || !props.collection) return;

    loading.value = true;
    error.value = '';

    try {
      // Get songs for this collection
      const response = await fetch(`/api/collections/${props.collectionId}/songs`);
      const contentType = response.headers.get('content-type') || '';

      if (response.ok && contentType.includes('application/json')) {
        const result = await response.json();
        // Combine collection info with songs
        collection.value = {
          ...props.collection,
          songs: result.data || []
        };
      } else if (response.status === 404) {
        error.value = 'Collection not found';
      } else {
        error.value = `Failed to load songs: ${await response.text()}`;
      }
    } catch (err) {
      error.value = `Failed to fetch songs: ${err.message}`;
    } finally {
      loading.value = false;
    }
  }

  async function deleteSong(songId) {
    if (!confirm('Are you sure you want to delete this song?')) return;

    try {
      const response = await fetch(`/api/collections/${props.collectionId}/songs/${songId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        // Remove song from local collection
        collection.value.songs = collection.value.songs.filter(song => song.id !== songId);
      } else {
        alert('Failed to delete song');
      }
    } catch (error) {
      alert('Error deleting song: ' + error.message);
    }
  }

  function handleSongAdded(newSong) {
    collection.value.songs.push(newSong);
  }

  // Watch for changes to collectionId and collection props
  watch([() => props.collectionId, () => props.collection], () => {
    fetchCollection();
  }, { immediate: true });
  </script>