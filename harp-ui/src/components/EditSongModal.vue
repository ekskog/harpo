<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-slate-800 mb-4">
          Edit Song
        </h2>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="title" class="block text-sm font-medium text-slate-700 mb-1">
              Song Title *
            </label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              required
              class="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="Enter song title"
            />
          </div>

          <div>
            <label for="trackOrder" class="block text-sm font-medium text-slate-700 mb-1">
              Track Order (optional)
            </label>
            <input
              id="trackOrder"
              v-model="form.trackOrder"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="Enter track number"
            />
          </div>

          <div v-if="error" class="text-red-600 text-sm">
            {{ error }}
          </div>

          <div class="flex justify-end space-x-2">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
            >
              {{ loading ? 'Updating...' : 'Update Song' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { collectionsApi } from '../services/api.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  collectionId: {
    type: [Number, String],
    required: true
  },
  song: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'song-updated'])

const { getAuthHeaders } = useAuth()

const form = ref({
  title: '',
  trackOrder: null
})
const loading = ref(false)
const error = ref('')

// Watch for song changes to populate form
watch(() => props.song, (newSong) => {
  if (newSong) {
    form.value = {
      title: newSong.title || '',
      trackOrder: newSong.track_order || null
    }
  }
}, { immediate: true })

async function handleSubmit() {
  if (!props.song || !props.collectionId) return

  loading.value = true
  error.value = ''

  // Validate title
  const trimmedTitle = form.value.title?.trim()
  if (!trimmedTitle) {
    error.value = 'Song title is required'
    loading.value = false
    return
  }

  // Build request payload
  const payload = {
    title: trimmedTitle
  }

  // Only include trackOrder if it has a valid numeric value
  const trackOrderValue = form.value.trackOrder
  if (trackOrderValue !== null && trackOrderValue !== undefined && trackOrderValue !== '' && !isNaN(trackOrderValue)) {
    payload.trackOrder = parseInt(trackOrderValue, 10)
  }

  try {
    const result = await collectionsApi.updateSong(
      props.collectionId,
      props.song.id,
      payload,
      getAuthHeaders()
    )

    if (result.success) {
      emit('song-updated', result.data)
      emit('close')
    } else {
      error.value = result.message || 'Failed to update song'
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>