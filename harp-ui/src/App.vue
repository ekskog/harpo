<template>
  <div class="min-h-screen flex flex-col bg-slate-100 text-slate-900">
    <!-- Main Content -->
    <main class="flex-1 w-full max-w-3xl mx-auto px-6 py-10">
      <!-- Dropdown -->
      <div v-if="loading" class="text-gray-500">Loading collections...</div>
      <div v-else-if="error" class="text-red-600">{{ error }}</div>
      <div v-else>
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <label
              for="collection-select"
              class="block text-2xl font-bold text-slate-800"
            >
              The Harp of J.S.E.
            </label>
            <div class="flex items-center space-x-2">
              <button
                v-if="selectedCollection"
                @click="deleteSelectedCollection"
                class="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                :disabled="deletingCollection"
                title="Delete Collection"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                @click="showCreateCollection = true"
                class="p-2 text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
                title="New Collection"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>
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
        <CollectionView
          v-if="selectedCollection"
          :collection-id="selectedCollection"
          :collection="selectedCollectionData"
          @refresh-collections="fetchCollections"
          @close="handleCloseCollection"
        />
      </div>
    </main>

    <!-- Sticky Footer -->
    <footer
      class="mt-auto w-full bg-slate-100 text-black border-t border-slate-200"
    >
      <HealthChecker @show-login="showLoginModal = true" />
    </footer>

    <!-- Login Modal -->
    <LoginModal
      :show="showLoginModal"
      @close="showLoginModal = false"
      @authenticated="handleAuthenticated"
    />

    <!-- Create Collection Modal -->
    <CreateCollectionModal
      :show="showCreateCollection"
      @close="showCreateCollection = false"
      @collection-created="handleCollectionCreated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import HealthChecker from "./components/HealthChecker.vue";
import CollectionView from "./components/CollectionView.vue";
import LoginModal from "./components/LoginModal.vue";
import CreateCollectionModal from "./components/CreateCollectionModal.vue";
import { useAuth } from "./composables/useAuth.js";

const { isAuthenticated, getAuthHeaders } = useAuth();

const collections = ref([]);
const selectedCollection = ref("");
const loading = ref(true);
const error = ref("");
const showLoginModal = ref(false);
const showCreateCollection = ref(false);
const deletingCollection = ref(false);

const selectedCollectionData = computed(() => {
  return (
    collections.value.find((c) => c.id == selectedCollection.value) || null
  );
});

async function fetchCollections() {
  try {
    const response = await fetch("/api/v1/collections");
    const contentType = response.headers.get("content-type") || "";
    if (response.ok && contentType.includes("application/json")) {
      const result = await response.json();
      collections.value = result.data || [];
      loading.value = false;
    } else {
      error.value = `Unexpected response: ${await response.text()}`;
    }
  } catch (err) {
    error.value = `Failed to fetch collections: ${err.message}`;
  }
}

function handleAuthenticated() {
  fetchCollections(); // Refresh collections after login
}

function handleCollectionCreated(newCollection) {
  collections.value.push(newCollection);
  selectedCollection.value = newCollection.id;
}

async function deleteSelectedCollection() {
  if (!selectedCollection.value) return;

  if (
    !confirm(
      "Are you sure you want to delete this collection and all its songs? This action cannot be undone."
    )
  ) {
    return;
  }

  deletingCollection.value = true;
  try {
    const response = await fetch(
      `/api/v1/collections/${selectedCollection.value}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (response.ok) {
      // Remove from local collections list
      collections.value = collections.value.filter(
        (c) => c.id != selectedCollection.value
      );
      selectedCollection.value = "";
    } else {
      alert("Failed to delete collection");
    }
  } catch (error) {
    alert("Error deleting collection: " + error.message);
  } finally {
    deletingCollection.value = false;
  }
}

function handleCloseCollection() {
  selectedCollection.value = '';
}

onMounted(() => {
  fetchCollections();
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap');

body {
  font-family: 'Atkinson Hyperlegible', sans-serif;
}
</style>