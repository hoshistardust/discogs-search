<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-container" :class="{ wide: useColumns }">
        <div class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
          <button class="close-button" @click="close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <div class="modal-content">
          <!-- Search Input -->
          <div v-if="searchable" class="search-box">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M14 14L11.1 11.1"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="search-input"
            />
          </div>

          <div class="options-list" :class="{ 'three-columns': useColumns }">
            <label
              v-for="option in filteredOptions"
              :key="option"
              class="option-item"
            >
              <input
                type="checkbox"
                :value="option"
                :checked="selectedItems.includes(option)"
                @change="toggleSelection(option)"
                class="option-checkbox"
              />
              <span class="option-label">{{ option }}</span>
            </label>
          </div>
          <div v-if="filteredOptions.length === 0" class="no-results">
            No results found
          </div>
        </div>

        <div class="modal-footer">
          <button class="button-secondary" @click="close">Cancel</button>
          <button class="button-primary" @click="confirm">OK</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, watch, computed } from "vue";

export default {
  name: "MultiSelectPopup",
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "Select Options",
    },
    options: {
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: Array,
      default: () => [],
    },
    searchable: {
      type: Boolean,
      default: false,
    },
    useColumns: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "close", "confirm"],
  setup(props, { emit }) {
    const selectedItems = ref([...props.modelValue]);
    const searchQuery = ref("");

    const filteredOptions = computed(() => {
      if (!props.searchable || !searchQuery.value.trim()) {
        return props.options;
      }
      const query = searchQuery.value.toLowerCase();
      return props.options.filter((option) =>
        option.toLowerCase().includes(query)
      );
    });

    watch(
      () => props.modelValue,
      (newVal) => {
        selectedItems.value = [...newVal];
      }
    );

    watch(
      () => props.isOpen,
      (newVal) => {
        if (newVal) {
          selectedItems.value = [...props.modelValue];
          searchQuery.value = "";
        }
      }
    );

    const toggleSelection = (option) => {
      const index = selectedItems.value.indexOf(option);
      if (index > -1) {
        selectedItems.value.splice(index, 1);
      } else {
        selectedItems.value.push(option);
      }
    };

    const close = () => {
      emit("close");
    };

    const confirm = () => {
      emit("update:modelValue", selectedItems.value);
      emit("confirm", selectedItems.value);
      emit("close");
    };

    return {
      selectedItems,
      searchQuery,
      filteredOptions,
      toggleSelection,
      close,
      confirm,
    };
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 0;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-container.wide {
  max-width: 800px;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 2px solid #000000;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-family: "Inria Sans", sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #000000;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #717171;
  transition: color 0.2s;
}

.close-button:hover {
  color: #000000;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.search-box {
  position: relative;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 0;
  padding: 10px 16px;
  gap: 8px;
}

.search-icon {
  flex-shrink: 0;
  color: #717171;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  color: #000000;
}

.search-input::placeholder {
  color: #717171;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.options-list.three-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 16px;
}

.no-results {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  color: #717171;
  text-align: center;
  padding: 20px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.option-item:hover {
  background-color: #f5f5f5;
}

.option-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #000000;
  border-radius: 0;
}

.option-label {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  color: #000000;
  cursor: pointer;
  user-select: none;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 2px solid #000000;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.button-primary,
.button-secondary {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  padding: 10px 24px;
  border-radius: 0;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.button-primary {
  background: #000000;
  color: white;
}

.button-primary:hover {
  background: #333333;
}

.button-secondary {
  background: white;
  color: #000000;
  border: 2px solid #000000;
}

.button-secondary:hover {
  background: #f5f5f5;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    max-height: 90vh;
  }

  .modal-title {
    font-size: 20px;
  }

  .option-label {
    font-size: 14px;
  }
}
</style>
