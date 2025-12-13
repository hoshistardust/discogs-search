<template>
  <div class="filter-sidebar" :class="{ open: isOpen }">
    <!-- Genre Filter -->
    <div class="filter-section">
      <div class="filter-header" @click="toggleSection('genre')">
        <h3 class="filter-title">Genre</h3>
        <button class="toggle-btn" :aria-label="genreExpanded ? 'Collapse' : 'Expand'">
          {{ genreExpanded ? '−' : '+' }}
        </button>
      </div>
      <div class="filter-divider"></div>
      <Transition name="expand">
        <div v-show="genreExpanded" class="filter-content">
          <div class="filter-options">
            <button
              v-for="genre in displayedGenres"
              :key="genre"
              class="filter-option"
              :class="{ active: selectedGenres.includes(genre) }"
              @click="toggleGenre(genre)"
            >
              {{ genre }}
            </button>
          </div>
          <button
            v-if="availableGenres.length > 12"
            class="view-all-btn"
            @click="openGenresPopup"
          >
            View all genres
          </button>
        </div>
      </Transition>
    </div>

    <!-- Style Filter -->
    <div class="filter-section">
      <div class="filter-header" @click="toggleSection('style')">
        <h3 class="filter-title">Style</h3>
        <button class="toggle-btn" :aria-label="styleExpanded ? 'Collapse' : 'Expand'">
          {{ styleExpanded ? '−' : '+' }}
        </button>
      </div>
      <div class="filter-divider"></div>
      <Transition name="expand">
        <div v-show="styleExpanded" class="filter-content">
          <div class="filter-options">
            <button
              v-for="style in displayedStyles"
              :key="style"
              class="filter-option"
              :class="{ active: selectedStyles.includes(style) }"
              @click="toggleStyle(style)"
            >
              {{ style }}
            </button>
          </div>
          <button
            v-if="availableStyles.length > 12"
            class="view-all-btn"
            @click="openStylesPopup"
          >
            View all styles
          </button>
        </div>
      </Transition>
    </div>

    <!-- Format Filter -->
    <div class="filter-section">
      <div class="filter-header" @click="toggleSection('format')">
        <h3 class="filter-title">Format</h3>
        <button class="toggle-btn" :aria-label="formatExpanded ? 'Collapse' : 'Expand'">
          {{ formatExpanded ? '−' : '+' }}
        </button>
      </div>
      <div class="filter-divider"></div>
      <Transition name="expand">
        <div v-show="formatExpanded" class="filter-content">
          <div class="filter-options">
            <button
              v-for="format in displayedFormats"
              :key="format"
              class="filter-option"
              :class="{ active: selectedFormats.includes(format) }"
              @click="toggleFormat(format)"
            >
              {{ format }}
            </button>
          </div>
          <button
            v-if="availableFormats.length > 12"
            class="view-all-btn"
            @click="openFormatsPopup"
          >
            View all formats
          </button>
        </div>
      </Transition>
    </div>

    <!-- Country Filter -->
    <div class="filter-section">
      <div class="filter-header" @click="toggleSection('country')">
        <h3 class="filter-title">Country</h3>
        <button class="toggle-btn" :aria-label="countryExpanded ? 'Collapse' : 'Expand'">
          {{ countryExpanded ? '−' : '+' }}
        </button>
      </div>
      <div class="filter-divider"></div>
      <Transition name="expand">
        <div v-show="countryExpanded" class="filter-content">
          <div class="filter-options">
            <button
              v-for="country in displayedCountries"
              :key="country"
              class="filter-option"
              :class="{ active: selectedCountries.includes(country) }"
              @click="toggleCountry(country)"
            >
              {{ country }}
            </button>
          </div>
          <button
            v-if="availableCountries.length > 12"
            class="view-all-btn"
            @click="openCountriesPopup"
          >
            View all countries
          </button>
        </div>
      </Transition>
    </div>

    <!-- Decade Filter -->
    <div class="filter-section">
      <div class="filter-header" @click="toggleSection('decade')">
        <h3 class="filter-title">Decade</h3>
        <button class="toggle-btn" :aria-label="decadeExpanded ? 'Collapse' : 'Expand'">
          {{ decadeExpanded ? '−' : '+' }}
        </button>
      </div>
      <div class="filter-divider"></div>
      <Transition name="expand">
        <div v-show="decadeExpanded" class="filter-options">
          <button
            v-for="decade in displayedDecades"
            :key="decade"
            class="filter-option"
            :class="{ active: selectedDecades.includes(decade) }"
            @click="toggleDecade(decade)"
          >
            {{ decade }}s
          </button>
        </div>
      </Transition>
    </div>

    <!-- Format Popup -->
    <MultiSelectPopup
      :is-open="showFormatsPopup"
      title="All Formats"
      :options="allFormats"
      v-model="selectedFormats"
      :searchable="true"
      @close="showFormatsPopup = false"
    />

    <!-- Country Popup -->
    <MultiSelectPopup
      :is-open="showCountriesPopup"
      title="All Countries"
      :options="allCountries"
      v-model="selectedCountries"
      :searchable="true"
      @close="showCountriesPopup = false"
    />

    <!-- Genre Popup -->
    <MultiSelectPopup
      :is-open="showGenresPopup"
      title="All Genres"
      :options="allGenres"
      v-model="selectedGenres"
      :searchable="true"
      @close="showGenresPopup = false"
    />

    <!-- Style Popup -->
    <MultiSelectPopup
      :is-open="showStylesPopup"
      title="All Styles"
      :options="allStyles"
      v-model="selectedStyles"
      :searchable="true"
      @close="showStylesPopup = false"
    />
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import MultiSelectPopup from './MultiSelectPopup.vue';
import { getFormats, getCountries, getGenres, getStyles } from '../services/discogs.js';

export default {
  name: 'FilterSidebar',
  components: {
    MultiSelectPopup,
  },
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
    availableFormats: {
      type: Array,
      default: () => [],
    },
    availableCountries: {
      type: Array,
      default: () => [],
    },
    availableGenres: {
      type: Array,
      default: () => [],
    },
    availableStyles: {
      type: Array,
      default: () => [],
    },
    availableDecades: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['filter-change'],
  setup(props, { emit }) {
    const formatExpanded = ref(true);
    const countryExpanded = ref(true);
    const decadeExpanded = ref(true);
    const genreExpanded = ref(true);
    const styleExpanded = ref(true);

    const selectedFormats = ref([]);
    const selectedCountries = ref([]);
    const selectedDecades = ref([]);
    const selectedGenres = ref([]);
    const selectedStyles = ref([]);

    const showFormatsPopup = ref(false);
    const showCountriesPopup = ref(false);
    const showGenresPopup = ref(false);
    const showStylesPopup = ref(false);

    // Complete lists for "View all" popups (all available options)
    const allFormats = ref(getFormats());
    const allCountries = ref(getCountries());
    const allGenres = ref(getGenres());
    const allStyles = ref(getStyles());

    // Top 12 from search results for sidebar display
    const displayedFormats = computed(() => props.availableFormats.slice(0, 12));
    const displayedCountries = computed(() => props.availableCountries.slice(0, 12));
    const displayedGenres = computed(() => props.availableGenres.slice(0, 12));
    const displayedStyles = computed(() => props.availableStyles.slice(0, 12));
    const displayedDecades = computed(() => props.availableDecades.slice(0, 12));

    const toggleSection = (section) => {
      if (section === 'format') formatExpanded.value = !formatExpanded.value;
      if (section === 'country') countryExpanded.value = !countryExpanded.value;
      if (section === 'decade') decadeExpanded.value = !decadeExpanded.value;
      if (section === 'genre') genreExpanded.value = !genreExpanded.value;
      if (section === 'style') styleExpanded.value = !styleExpanded.value;
    };

    const toggleFormat = (format) => {
      const index = selectedFormats.value.indexOf(format);
      if (index > -1) {
        selectedFormats.value.splice(index, 1);
      } else {
        selectedFormats.value.push(format);
      }
      emitFilterChange();
    };

    const toggleCountry = (country) => {
      const index = selectedCountries.value.indexOf(country);
      if (index > -1) {
        selectedCountries.value.splice(index, 1);
      } else {
        selectedCountries.value.push(country);
      }
      emitFilterChange();
    };

    const toggleDecade = (decade) => {
      const index = selectedDecades.value.indexOf(decade);
      if (index > -1) {
        selectedDecades.value.splice(index, 1);
      } else {
        selectedDecades.value.push(decade);
      }
      emitFilterChange();
    };

    const toggleGenre = (genre) => {
      const index = selectedGenres.value.indexOf(genre);
      if (index > -1) {
        selectedGenres.value.splice(index, 1);
      } else {
        selectedGenres.value.push(genre);
      }
      emitFilterChange();
    };

    const toggleStyle = (style) => {
      const index = selectedStyles.value.indexOf(style);
      if (index > -1) {
        selectedStyles.value.splice(index, 1);
      } else {
        selectedStyles.value.push(style);
      }
      emitFilterChange();
    };

    const openFormatsPopup = () => {
      showFormatsPopup.value = true;
    };

    const openCountriesPopup = () => {
      showCountriesPopup.value = true;
    };

    const openGenresPopup = () => {
      showGenresPopup.value = true;
    };

    const openStylesPopup = () => {
      showStylesPopup.value = true;
    };

    const emitFilterChange = () => {
      emit('filter-change', {
        formats: selectedFormats.value,
        countries: selectedCountries.value,
        decades: selectedDecades.value,
        genres: selectedGenres.value,
        styles: selectedStyles.value,
      });
    };

    watch([selectedFormats, selectedCountries, selectedDecades, selectedGenres, selectedStyles], () => {
      emitFilterChange();
    }, { deep: true });

    return {
      formatExpanded,
      countryExpanded,
      decadeExpanded,
      genreExpanded,
      styleExpanded,
      selectedFormats,
      selectedCountries,
      selectedDecades,
      selectedGenres,
      selectedStyles,
      showFormatsPopup,
      showCountriesPopup,
      showGenresPopup,
      showStylesPopup,
      allFormats,
      allCountries,
      allGenres,
      allStyles,
      displayedFormats,
      displayedCountries,
      displayedGenres,
      displayedStyles,
      displayedDecades,
      toggleSection,
      toggleFormat,
      toggleCountry,
      toggleDecade,
      toggleGenre,
      toggleStyle,
      openFormatsPopup,
      openCountriesPopup,
      openGenresPopup,
      openStylesPopup,
    };
  },
};
</script>

<style scoped>
.filter-sidebar {
  position: absolute;
  left: -280px;
  top: 0;
  width: 280px;
  min-height: 100%;
  background: white;
  border-right: 2px solid #000000;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  padding: 20px;
}

.filter-sidebar.open {
  left: 0;
}

.filter-section {
  margin-bottom: 32px;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  margin-bottom: 12px;
  user-select: none;
}

.filter-divider {
  height: 2px;
  background: #000000;
  margin-bottom: 12px;
}

.filter-title {
  font-family: 'Inria Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #000000;
  margin: 0;
}

.toggle-btn {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  transition: transform 0.3s ease;
}

.toggle-btn:hover {
  transform: rotate(90deg);
}

.filter-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-option {
  font-family: 'Inria Sans', sans-serif;
  font-size: 14px;
  padding: 6px 16px;
  border: 1px solid #000000;
  border-radius: 0;
  background: white;
  color: #000000;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-option:hover {
  background: #f0f0f0;
}

.filter-option.active {
  background: #000000;
  color: white;
}

.view-all-btn {
  font-family: 'Inria Sans', sans-serif;
  font-size: 14px;
  color: #717171;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: right;
  text-decoration: none;
  transition: color 0.2s;
  align-self: flex-end;
}

.view-all-btn:hover {
  color: #000000;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 500px;
  opacity: 1;
}

@media (max-width: 1024px) {
  .filter-sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    height: 100vh;
    min-height: auto;
    z-index: 101;
    overflow-y: auto;
  }

  .filter-sidebar.open {
    left: 0;
  }
}
</style>
