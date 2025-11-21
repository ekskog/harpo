<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-slate-800 mb-4">Add Song to Collection</h2>

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
              v-model.number="form.trackOrder"
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
              {{ loading ? 'Adding...' : 'Add Song' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth.js';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  collectionId: {
    type: [Number, String],
    required: true,
  },
});

const emit = defineEmits(['close', 'song-added']);

const { getAuthHeaders } = useAuth();

const form = ref({
  title: '',
  trackOrder: null,
});
const loading = ref(false);
const error = ref('');

async function handleSubmit() {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(`/api/collections/${props.collectionId}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        title: form.value.title,
        trackOrder: form.value.trackOrder || undefined,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      emit('song-added', result.data);
      emit('close');
      form.value = { title: '', trackOrder: null };
    } else {
      error.value = result.message || 'Failed to add song';
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>