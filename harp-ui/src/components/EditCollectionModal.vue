<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-slate-800 mb-4">
          Edit Collection
        </h2>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-slate-700 mb-1">
              Collection Name *
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="Enter collection name"
            />
          </div>

          <div>
            <label for="source" class="block text-sm font-medium text-slate-700 mb-1">
              Source *
            </label>
            <input
              id="source"
              v-model="form.source"
              type="text"
              required
              class="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="e.g., nfdb, tndtbwu"
            />
            <p class="text-xs text-slate-500 mt-1">
              Short identifier for the collection (lowercase, no spaces)
            </p>
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-slate-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="Enter collection description"
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
              {{ loading ? 'Updating...' : 'Update Collection' }}
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
  collection: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'collection-updated'])

const { getAuthHeaders } = useAuth()

const form = ref({
  name: '',
  source: '',
  description: ''
})
const loading = ref(false)
const error = ref('')

// Watch for collection changes to populate form
watch(() => props.collection, (newCollection) => {
  if (newCollection) {
    form.value = {
      name: newCollection.name || '',
      source: newCollection.source || '',
      description: newCollection.description || ''
    }
  }
}, { immediate: true })

async function handleSubmit() {
  if (!props.collection) return

  loading.value = true
  error.value = ''

  try {
    const result = await collectionsApi.update(props.collection.id, form.value, getAuthHeaders())

    if (result.success) {
      emit('collection-updated', result.data)
      emit('close')
    } else {
      error.value = result.message || 'Failed to update collection'
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>