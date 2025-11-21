<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-slate-800 mb-4">
          {{ isLogin ? 'Login' : 'Register' }}
        </h2>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              class="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="Enter password"
            />
          </div>

          <div v-if="error" class="text-red-600 text-sm">
            {{ error }}
          </div>

          <div class="flex justify-between items-center">
            <button
              type="button"
              @click="toggleMode"
              class="text-slate-600 hover:text-slate-800 text-sm"
            >
              {{ isLogin ? 'Need an account?' : 'Already have an account?' }}
            </button>

            <div class="space-x-2">
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
                {{ loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register') }}
              </button>
            </div>
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

const emit = defineEmits(['close', 'authenticated']);

const { login, register } = useAuth();

const isLogin = ref(true);
const form = ref({
  username: '',
  password: '',
});
const loading = ref(false);
const error = ref('');

function toggleMode() {
  isLogin.value = !isLogin.value;
  error.value = '';
  form.value = { username: '', password: '' };
}

async function handleSubmit() {
  loading.value = true;
  error.value = '';

  const result = isLogin.value
    ? await login(form.value.username, form.value.password)
    : await register(form.value.username, form.value.password);

  loading.value = false;

  if (result.success) {
    emit('authenticated');
    emit('close');
  } else {
    error.value = result.error;
  }
}
</script>