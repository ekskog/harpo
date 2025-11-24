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
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-2xl font-bold text-slate-800">
              Songs
              <span class="text-sm font-normal text-slate-500 ml-2">
                ({{ collection.songs.length }})
              </span>
            </h3>
            <button
              v-if="isAuthenticated"
              @click="showAddSong = true"
              class="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
            >
              + Add Song
            </button>
          </div>
          <div v-if="collection.songs.length === 0" class="text-gray-500 italic">
            No songs in this collection yet.
          </div>
          <ol v-else class="space-y-2">
            <li
              v-for="song in collection.songs"
              :key="song.id"
              class="flex items-center justify-between p-3 rounded transition-colors"
              :class="selectedSong?.id === song.id ? 'bg-slate-100' : 'hover:bg-slate-50'"
            >
              <div class="flex items-center flex-1">
                <span class="text-slate-500 font-mono text-sm mr-4 min-w-[2rem]">
                  {{ song.track_order || '—' }}
                </span>
                <button
                  @click="showLyrics(song)"
                  class="text-slate-800 font-medium hover:text-slate-600 text-left cursor-pointer"
                >
                  {{ song.title }}
                </button>
              </div>
              <button
                v-if="isAuthenticated"
                @click.stop="deleteSong(song.id)"
                class="text-red-600 hover:text-red-800 p-1 ml-2"
                title="Delete song"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          </ol>
        </div>

        <!-- Lyrics Panel (Below Songs) -->
        <Transition name="expand">
          <div v-if="showLyricsPanel" class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="bg-slate-100 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 class="text-xl font-bold text-slate-800">{{ selectedSong?.title }}</h3>
                <p class="text-sm text-slate-500 mt-1">Lyrics</p>
              </div>
              <button
                @click="closeLyricsPanel"
                class="text-slate-500 hover:text-slate-700 p-2"
                title="Close"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="p-6 max-h-96 overflow-y-auto">
              <div v-if="loadingLyrics" class="text-center py-12">
                <div class="text-slate-500">Loading lyrics...</div>
              </div>
              <div v-else-if="lyrics" class="prose max-w-none">
                <pre class="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">{{ lyrics }}</pre>
              </div>
              <div v-else class="text-center py-12">
                <p class="text-red-600 mb-4" v-if="lyricsError">{{ lyricsError }}</p>
                <p class="text-slate-500 mb-4" v-else>No lyrics available for this song.</p>
                
                <div v-if="isAuthenticated && !showAddLyricsForm">
                  <button
                    @click="showAddLyricsForm = true"
                    class="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
                  >
                    Add Lyrics
                  </button>
                </div>
                
                <div v-if="showAddLyricsForm" class="max-w-2xl mx-auto text-left">
                  <textarea
                    v-model="newLyrics"
                    placeholder="Enter lyrics here..."
                    class="w-full h-64 p-4 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 font-sans"
                  ></textarea>
                  <div class="flex gap-2 mt-4 justify-end">
                    <button
                      @click="cancelAddLyrics"
                      class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      @click="submitLyrics"
                      :disabled="!newLyrics.trim() || savingLyrics"
                      class="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {{ savingLyrics ? 'Saving...' : 'Save Lyrics' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
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

  <style scoped>
  .expand-enter-active,
  .expand-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .expand-enter-from,
  .expand-leave-to {
    opacity: 0;
    max-height: 0;
    transform: scaleY(0.8);
  }

  .expand-enter-to,
  .expand-leave-from {
    opacity: 1;
    max-height: 1000px;
    transform: scaleY(1);
  }
  </style>

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
  const showLyricsPanel = ref(false);
  const selectedSong = ref(null);
  const lyrics = ref('');
  const loadingLyrics = ref(false);
  const lyricsError = ref('');
  const showAddLyricsForm = ref(false);
  const newLyrics = ref('');
  const savingLyrics = ref(false);

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
        // Close lyrics panel if the deleted song was selected
        if (selectedSong.value?.id === songId) {
          closeLyricsPanel();
        }
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

  async function showLyrics(song) {
    // If clicking the same song, toggle the panel
    if (selectedSong.value?.id === song.id && showLyricsPanel.value) {
      closeLyricsPanel();
      return;
    }

    selectedSong.value = song;
    showLyricsPanel.value = true;
    lyrics.value = '';
    lyricsError.value = '';
    await fetchLyrics();
  }

  async function fetchLyrics() {
    if (!selectedSong.value || !props.collectionId) return;

    loadingLyrics.value = true;
    lyricsError.value = '';

    try {
      const response = await fetch(
        `/api/collections/${props.collectionId}/songs/${selectedSong.value.id}/lyrics`
      );
      const contentType = response.headers.get('content-type') || '';

      if (response.ok && contentType.includes('application/json')) {
        const result = await response.json();
        lyrics.value = result.data?.lyrics || '';
      } else if (response.status === 404) {
        lyricsError.value = 'Lyrics not found for this song';
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load lyrics' }));
        lyricsError.value = errorData.message || 'Failed to load lyrics';
      }
    } catch (err) {
      lyricsError.value = `Error: ${err.message}`;
    } finally {
      loadingLyrics.value = false;
    }
  }

  function closeLyricsPanel() {
    showLyricsPanel.value = false;
    selectedSong.value = null;
    lyrics.value = '';
    lyricsError.value = '';
    showAddLyricsForm.value = false;
    newLyrics.value = '';
  }

  function cancelAddLyrics() {
    showAddLyricsForm.value = false;
    newLyrics.value = '';
  }

  async function submitLyrics() {
    if (!newLyrics.value.trim() || !selectedSong.value || !props.collectionId) return;

    savingLyrics.value = true;

    try {
      const response = await fetch(
        `/api/collections/${props.collectionId}/songs/${selectedSong.value.id}/lyrics`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lyrics: newLyrics.value }),
        }
      );

      if (response.ok) {
        lyrics.value = newLyrics.value;
        showAddLyricsForm.value = false;
        newLyrics.value = '';
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save lyrics' }));
        alert(errorData.message || 'Failed to save lyrics');
      }
    } catch (err) {
      alert(`Error saving lyrics: ${err.message}`);
    } finally {
      savingLyrics.value = false;
    }
  }

  // Watch for changes to collectionId and collection props
  watch([() => props.collectionId, () => props.collection], () => {
    fetchCollection();
  }, { immediate: true });
  </script>