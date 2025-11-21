<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-slate-800 mb-4">Create New Collection</h2>

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
              {{ loading ? 'Creating...' : 'Create Collection' }}
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
});

const emit = defineEmits(['close', 'collection-created']);

const { getAuthHeaders } = useAuth();

const form = ref({
  name: '',
  description: '',
});
const loading = ref(false);
const error = ref('');

async function handleSubmit() {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch('/api/collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(form.value),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      emit('collection-created', result.data);
      emit('close');
      form.value = { name: '', description: '' };
    } else {
      error.value = result.message || 'Failed to create collection';
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>