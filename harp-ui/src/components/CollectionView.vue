<template>
  <div class="mt-6">
    <div v-if="loading" class="text-gray-500">
      Loading collection...
    </div>
    <div v-else-if="error" class="text-red-600">
      {{ error }}
    </div>
    <div v-else-if="collection" class="space-y-6">
      <!-- Collection Details -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center">
            <img 
              v-if="collection.id"
              :src="`/api/collections/${collection.id}/cover`" 
              class="w-16 h-16 mr-4 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
              @error="handleImageError"
              @click="openImageModal"
              alt="Collection cover"
            />
            <div>
              <h2 class="text-2xl font-bold text-slate-800 flex items-center">
                {{ collection.name }}
                <a v-if="collection.bandcamp_url" :href="collection.bandcamp_url" target="_blank" class="ml-2" title="Available on Bandcamp">
                  <svg class="w-6 h-6 text-blue-300 hover:text-blue-500" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M354.27,407.291H0.5l157.231-302.582H511.5L354.27,407.291z"/>
                  </svg>
                </a>
              </h2>
              <p v-if="collection.description" class="text-slate-600 mt-1">
                {{ collection.description }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button
              v-if="isAuthenticated"
              @click="showEditCollection = true"
              class="p-2 text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
              title="Edit Collection"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              v-if="isAuthenticated"
              @click="$refs.coverUpload.click()"
              class="p-2 text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
              title="Upload Cover Image"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <input
              ref="coverUpload"
              type="file"
              accept="image/*"
              @change="handleCoverUpload"
              class="hidden"
            />
            <button
              @click="$emit('close')"
              class="text-slate-400 hover:text-slate-600 p-1 -mt-1 hover:bg-slate-200 rounded transition-colors"
              title="Close collection"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
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
            class="p-2 text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
            title="Add Song"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
        <div v-if="collection.songs.length === 0" class="text-gray-500 italic">
          No songs in this collection yet.
        </div>
        <ol v-else class="space-y-2">
          <li
            v-for="song in collection.songs"
            :key="song.id"
            v-show="!showLyricsPanel || selectedSong?.id === song.id"
            class="flex items-center justify-between p-3 rounded transition-colors"
            :class="selectedSong?.id === song.id ? 'bg-slate-100' : 'hover:bg-slate-50'"
          >
            <div class="flex items-center flex-1 gap-3">
              <span class="text-slate-500 font-mono text-sm min-w-[2rem]">
                {{ song.track_order || '—' }}
              </span>
              <button
                type="button"
                class="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors"
                title="View song image"
                @click.stop="openSongImageModal(song)"
              >
                <img
                  v-if="!songImageErrors[song.id]"
                  :src="getSongImageUrl(song)"
                  class="w-4 h-4 object-cover rounded-full"
                  alt="Song thumbnail"
                  @error="handleSongThumbnailError(song.id)"
                />
                <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M15 10h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                @click="showLyrics(song)"
                class="text-slate-800 font-medium hover:text-slate-600 text-left cursor-pointer"
              >
                {{ song.title }}
              </button>
            </div>
            <div class="flex items-center space-x-1">
              <button
                v-if="isAuthenticated"
                @click.stop="editSong(song)"
                class="text-slate-600 hover:bg-slate-200 p-1 rounded transition-colors"
                title="Edit song"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                v-if="isAuthenticated"
                @click.stop="deleteSong(song.id)"
                class="text-red-600 hover:bg-red-50 p-1 ml-2 rounded transition-colors"
                title="Delete song"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </li>
        </ol>
      </div>

      <!-- Lyrics Panel (Below Songs) -->
      <Transition name="expand">
        <div v-if="showLyricsPanel" class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold text-slate-800">
                {{ selectedSong?.title }}
              </h3>
            </div>
            <button
              @click="closeLyricsPanel"
              class="text-slate-500 hover:text-slate-700 p-2 hover:bg-slate-200 rounded transition-colors"
              title="Close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-6 flex flex-col gap-6">
            <div v-if="loadingLyrics" class="text-center py-12">
              <div class="text-slate-500">
                Loading lyrics...
              </div>
            </div>
            <div v-else-if="lyrics && !showEditLyricsForm" class="flex items-start gap-6">
              <div
                v-if="selectedSong"
                class="flex-shrink-0"
              >
                <button
                  type="button"
                  class="block w-[150px] h-[150px] rounded-full overflow-hidden border border-slate-200 bg-slate-50 hover:border-slate-400 transition-colors"
                  title="View song image"
                  @click="openSongImageModal(selectedSong)"
                >
                  <img
                    v-if="!songImageErrors[selectedSong.id]"
                    :src="getSongImageUrl(selectedSong)"
                    class="w-full h-full object-cover"
                    alt="Song artwork"
                    @error="handleSongThumbnailError(selectedSong.id)"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center px-3"
                  >
                    No image
                  </div>
                </button>
              </div>
              <div class="prose max-w-none flex-1">
                <div class="flex justify-end mb-4">
                  <button
                    v-if="isAuthenticated"
                    @click="startEditLyrics"
                    class="p-2 text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
                    title="Edit Lyrics"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
                <pre class="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">{{ lyrics }}</pre>
              </div>
            </div>
            <div v-else-if="showEditLyricsForm" class="max-w-2xl mx-auto text-left">
              <textarea
                v-model="editLyrics"
                placeholder="Enter lyrics here..."
                class="w-full h-64 p-4 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 font-sans"
              />
              <div class="flex gap-2 mt-4 justify-end">
                <button
                  @click="cancelEditLyrics"
                  class="p-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                  title="Cancel"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  @click="submitEditLyrics"
                  :disabled="!editLyrics.trim() || savingLyrics"
                  class="p-2 text-slate-800 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Save Changes"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div v-else class="text-center py-12">
              <p v-if="lyricsError" class="text-red-600 mb-4">
                {{ lyricsError }}
              </p>
              <p v-else class="text-slate-500 mb-4">
                No lyrics available for this song.
              </p>
              
              <div v-if="isAuthenticated && !showAddLyricsForm">
                <button
                  @click="showAddLyricsForm = true"
                  class="p-2 text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
                  title="Add Lyrics"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
              
              <div v-if="showAddLyricsForm" class="max-w-2xl mx-auto text-left">
                <textarea
                  v-model="newLyrics"
                  placeholder="Enter lyrics here..."
                  class="w-full h-64 p-4 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 font-sans"
                />
                <div class="flex gap-2 mt-4 justify-end">
                  <button
                    @click="cancelAddLyrics"
                    class="p-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                    title="Cancel"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    @click="submitLyrics"
                    :disabled="!newLyrics.trim() || savingLyrics"
                    class="p-2 text-slate-800 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Save Lyrics"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
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

    <!-- Image Modal -->
    <ImageModal
      :show="showImageModal"
      :image-src="collection.id ? `/api/collections/${collection.id}/cover` : ''"
      alt="Collection cover"
      @close="showImageModal = false"
    />

    <!-- Edit Collection Modal -->
    <EditCollectionModal
      :show="showEditCollection"
      :collection="collection"
      @close="showEditCollection = false"
      @collection-updated="handleCollectionUpdated"
    />

    <!-- Edit Song Modal -->
    <EditSongModal
      :show="showEditSong"
      :collection-id="collectionId"
      :song="songToEdit"
      @close="showEditSong = false"
      @song-updated="handleSongUpdated"
    />
    <Transition name="modal">
      <div
        v-if="showSongImageModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
        @click="closeSongImageModal"
      >
        <div class="relative w-[520px] max-w-full p-4" @click.stop>
          <button
            @click="closeSongImageModal"
            class="absolute top-2 left-2 z-10 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2 transition-colors"
            title="Close"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div class="w-[500px] h-[500px] bg-white rounded-lg flex items-center justify-center overflow-hidden">
            <img
              v-if="!modalSongImageError"
              :src="modalSongImageUrl"
              class="w-[500px] h-[500px] object-contain"
              :alt="modalSong?.title || 'Song image'"
              @error="modalSongImageError = true"
            />
            <div
              v-else
              class="flex flex-col items-center justify-center text-center text-white px-6 gap-4"
            >
              <p class="text-lg font-semibold">Image unavailable</p>
              <p class="text-sm text-slate-200">
                No artwork found for this song. You can upload one if you have permission.
              </p>
              <button
                v-if="isAuthenticated && modalSong"
                type="button"
                class="px-4 py-2 bg-white text-slate-900 rounded font-medium hover:bg-slate-100 transition-colors"
                @click.stop="triggerSongImageUpload(modalSong)"
              >
                Upload image
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    <input
      ref="songImageUpload"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleSongImageUpload"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { collectionsApi } from '../services/api.js'
import AddSongModal from './AddSongModal.vue'
import EditCollectionModal from './EditCollectionModal.vue'
import EditSongModal from './EditSongModal.vue'
import ImageModal from './ImageModal.vue'

const props = defineProps({
  collectionId: {
    type: [Number, String],
    required: true
  },
  collection: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['refresh-collections', 'close'])

const { isAuthenticated, getAuthHeaders } = useAuth()

const collection = ref(null)
const loading = ref(false)
const error = ref('')
const showAddSong = ref(false)
const showLyricsPanel = ref(false)
const selectedSong = ref(null)
const lyrics = ref('')
const loadingLyrics = ref(false)
const lyricsError = ref('')
const showAddLyricsForm = ref(false)
const newLyrics = ref('')
const savingLyrics = ref(false)
const showEditLyricsForm = ref(false)
const editLyrics = ref('')
const showImageModal = ref(false)
const showEditCollection = ref(false)
const showEditSong = ref(false)
const songToEdit = ref(null)
const songImageUpload = ref(null)
const songImageErrors = ref({})
const songImageVersions = ref({})
const showSongImageModal = ref(false)
const modalSong = ref(null)
const modalSongImageError = ref(false)
const imageUploadSongId = ref(null)

const modalSongImageUrl = computed(() => {
  if (!modalSong.value) {
    return ''
  }
  return getSongImageUrl(modalSong.value)
})

function getSongImageUrl(song) {
  if (!song || !props.collectionId) {
    return ''
  }
  const baseUrl = `/api/collections/${props.collectionId}/songs/${song.id}/image`
  const version = songImageVersions.value[song.id]
  return version ? `${baseUrl}?t=${version}` : baseUrl
}

function handleImageError(event) {
  event.target.style.display = 'none'
}

function openImageModal() {
  showImageModal.value = true
}

async function handleCoverUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }

  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    alert('File size must be less than 10MB')
    return
  }

  try {
    const formData = new FormData()
    formData.append('cover', file)

    const result = await collectionsApi.uploadCover(props.collectionId, formData, getAuthHeaders())

    if (result.success) {
      alert('Cover image uploaded successfully!')
      // Force refresh of the cover image by adding a timestamp
      // This will trigger a re-render and show the new image
      const img = document.querySelector(`img[alt="Collection cover"]`)
      if (img) {
        img.src = `/api/collections/${props.collection.id}/cover?t=${Date.now()}`
      }
    } else {
      alert(result.message || 'Failed to upload cover image')
    }
  } catch (error) {
    alert('Error uploading cover image: ' + error.message)
  } finally {
    // Clear the file input
    event.target.value = ''
  }
}

async function fetchCollection() {
  if (!props.collectionId || !props.collection) return

  loading.value = true
  error.value = ''

  try {
    const result = await collectionsApi.getSongs(props.collectionId)
    // Combine collection info with songs
    collection.value = {
      ...props.collection,
      songs: result.data || []
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function deleteSong(songId) {
  if (!confirm('Are you sure you want to delete this song?')) return

  try {
    await collectionsApi.deleteSong(
      props.collectionId, 
      songId, 
      getAuthHeaders()
    )
    
    // Remove song from local collection
    collection.value.songs = collection.value.songs.filter(song => song.id !== songId)
    
    // Close lyrics panel if the deleted song was selected
    if (selectedSong.value?.id === songId) {
      closeLyricsPanel()
    }
  } catch (err) {
    alert(err.message)
  }
}

function handleSongAdded(newSong) {
  collection.value.songs.push(newSong)
}

function handleCollectionUpdated(updatedCollection) {
  // Update the collection data
  collection.value = {
    ...collection.value,
    ...updatedCollection
  }
  // Emit to parent to refresh collections list
  emit('refresh-collections')
}

function handleSongUpdated(updatedSong) {
  // Update the song in the local collection
  const index = collection.value.songs.findIndex(song => song.id === updatedSong.id)
  if (index !== -1) {
    collection.value.songs[index] = updatedSong
  }
  // Update selected song if it's the one being edited
  if (selectedSong.value?.id === updatedSong.id) {
    selectedSong.value = updatedSong
  }
}

function editSong(song) {
  songToEdit.value = song
  showEditSong.value = true
}

function handleSongThumbnailError(songId) {
  songImageErrors.value = {
    ...songImageErrors.value,
    [songId]: true
  }
}

function openSongImageModal(song) {
  modalSong.value = song
  modalSongImageError.value = false
  showSongImageModal.value = true
}

function closeSongImageModal() {
  showSongImageModal.value = false
  modalSong.value = null
  modalSongImageError.value = false
}

function triggerSongImageUpload(song) {
  const targetSong = song || selectedSong.value
  if (!targetSong) return

  imageUploadSongId.value = targetSong.id
  songImageUpload.value?.click()
}

async function handleSongImageUpload(event) {
  const file = event.target.files?.[0]
  const songId = imageUploadSongId.value

  if (!file || !songId) {
    event.target.value = ''
    return
  }

  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    event.target.value = ''
    imageUploadSongId.value = null
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    alert('File size must be less than 10MB')
    event.target.value = ''
    imageUploadSongId.value = null
    return
  }

  try {
    const formData = new FormData()
    formData.append('image', file)

    await collectionsApi.uploadSongImage(
      props.collectionId,
      songId,
      formData,
      getAuthHeaders()
    )

    songImageVersions.value = {
      ...songImageVersions.value,
      [songId]: Date.now()
    }
    songImageErrors.value = {
      ...songImageErrors.value,
      [songId]: false
    }

    if (modalSong.value?.id === songId) {
      modalSongImageError.value = false
    }
  } catch (err) {
    alert(err.message)
  } finally {
    event.target.value = ''
    imageUploadSongId.value = null
  }
}

async function showLyrics(song) {
  // If clicking the same song, toggle the panel
  if (selectedSong.value?.id === song.id && showLyricsPanel.value) {
    closeLyricsPanel()
    return
  }

  selectedSong.value = song
  showLyricsPanel.value = true
  lyrics.value = ''
  lyricsError.value = ''
  await fetchLyrics()
}

async function fetchLyrics() {
  if (!selectedSong.value || !props.collectionId) return

  loadingLyrics.value = true
  lyricsError.value = ''

  try {
    const result = await collectionsApi.getLyrics(
      props.collectionId, 
      selectedSong.value.id
    )
    lyrics.value = result.data?.lyrics || ''
  } catch (err) {
    lyricsError.value = err.message
  } finally {
    loadingLyrics.value = false
  }
}

function closeLyricsPanel() {
  showLyricsPanel.value = false
  selectedSong.value = null
  lyrics.value = ''
  lyricsError.value = ''
  showAddLyricsForm.value = false
  newLyrics.value = ''
  showEditLyricsForm.value = false
  editLyrics.value = ''
}

function cancelAddLyrics() {
  showAddLyricsForm.value = false
  newLyrics.value = ''
}

function startEditLyrics() {
  showEditLyricsForm.value = true
  editLyrics.value = lyrics.value
}

function cancelEditLyrics() {
  showEditLyricsForm.value = false
  editLyrics.value = ''
}

async function submitLyrics() {
  if (!newLyrics.value.trim() || !selectedSong.value || !props.collectionId) return

  savingLyrics.value = true

  try {
    await collectionsApi.saveLyrics(
      props.collectionId,
      selectedSong.value.id,
      newLyrics.value,
      getAuthHeaders()
    )
    
    lyrics.value = newLyrics.value
    showAddLyricsForm.value = false
    newLyrics.value = ''
  } catch (err) {
    alert(err.message)
  } finally {
    savingLyrics.value = false
  }
}

async function submitEditLyrics() {
  if (!editLyrics.value.trim() || !selectedSong.value || !props.collectionId) return

  savingLyrics.value = true

  try {
    await collectionsApi.updateLyrics(
      props.collectionId,
      selectedSong.value.id,
      editLyrics.value,
      getAuthHeaders()
    )
    
    lyrics.value = editLyrics.value
    showEditLyricsForm.value = false
    editLyrics.value = ''
  } catch (err) {
    alert(err.message)
  } finally {
    savingLyrics.value = false
  }
}

// Watch for changes to collectionId and collection props
watch([() => props.collectionId, () => props.collection], () => {
  // Reset lyrics panel state when collection changes
  showLyricsPanel.value = false
  selectedSong.value = null
  lyrics.value = ''
  lyricsError.value = ''
  showAddLyricsForm.value = false
  newLyrics.value = ''
  showEditLyricsForm.value = false
  editLyrics.value = ''
  savingLyrics.value = false
  showEditCollection.value = false
  showEditSong.value = false
  songToEdit.value = null
  
  fetchCollection()
}, { immediate: true })

</script>

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