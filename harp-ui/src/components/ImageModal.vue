<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" @click="$emit('close')">
      <div class="relative max-w-4xl max-h-screen p-4">
        <button
          @click="$emit('close')"
          class="absolute top-2 left-2 z-10 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2 transition-colors"
          title="Close"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img
          :src="imageSrc"
          class="w-[500px] h-[500px] object-contain rounded-lg"
          :alt="alt"
          @click.stop
        />
      </div>
    </div>
  </Transition>
</template>

<script setup>
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  imageSrc: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: 'Image'
  }
})

const emit = defineEmits(['close'])
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
}
</style>