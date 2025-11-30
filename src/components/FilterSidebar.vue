<template>
  <div class="filter-sidebar" :class="{ open: isOpen }">
    <!-- Format Filter -->
    <div class="filter-section">
      <div class="filter-header" @click="toggleSection('format')">
        <h3 class="filter-title">Format</h3>
        <button class="toggle-btn" :aria-label="formatExpanded ? 'Collapse' : 'Expand'">
          {{ formatExpanded ? '−' : '+' }}
        </button>
      </div>
      <Transition name="expand">
        <div v-show="formatExpanded" class="filter-options">
          <button
            v-for="(format, index) in displayedFormats"
            :key="format"
            class="filter-option"
            :class="{ active: selectedFormats.includes(format) }"
            @click="toggleFormat(format)"
          >
            {{ format }}
          </button>
          <button
            v-if="formats.length > 12"
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
      <Transition name="expand">
        <div v-show="countryExpanded" class="filter-options">
          <button
            v-for="country in displayedCountries"
            :key="country"
            class="filter-option"
            :class="{ active: selectedCountries.includes(country) }"
            @click="toggleCountry(country)"
          >
            {{ country }}
          </button>
          <button
            v-if="countries.length > 12"
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
          {{ decadeExpanded ? '+' : '−' }}
        </button>
      </div>
      <Transition name="expand">
        <div v-show="decadeExpanded" class="filter-options">
          <button
            v-for="decade in decades"
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
      :options="formats"
      v-model="selectedFormats"
      :searchable="true"
      @close="showFormatsPopup = false"
    />

    <!-- Country Popup -->
    <MultiSelectPopup
      :is-open="showCountriesPopup"
      title="All Countries"
      :options="countries"
      v-model="selectedCountries"
      :searchable="true"
      @close="showCountriesPopup = false"
    />
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import MultiSelectPopup from './MultiSelectPopup.vue';

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
  },
  emits: ['filter-change'],
  setup(props, { emit }) {
    const formatExpanded = ref(true);
    const countryExpanded = ref(true);
    const decadeExpanded = ref(false);

    const selectedFormats = ref([]);
    const selectedCountries = ref([]);
    const selectedDecades = ref([]);

    const showFormatsPopup = ref(false);
    const showCountriesPopup = ref(false);

    // Ranked formats - most common first (based on Discogs popularity)
    const formats = ref([
      'Vinyl', 'CD', 'Album', 'LP', 'Compilation', 'Reissue',
      'Stereo', 'Remastered', 'Box Set', 'Digital', 'Cassette', 'EP',
      'Single', 'DVD', 'Limited Edition', 'Picture Disc', '12"', '7"',
      'SACD', 'Blu-ray', 'Mono', 'Promo'
    ]);

    // Ranked countries - most common release countries
    const countries = ref([
      'US', 'UK', 'Germany', 'Japan', 'Europe', 'France',
      'Canada', 'Netherlands', 'Italy', 'Australia', 'Sweden', 'Spain',
      'Brazil', 'Belgium', 'Austria', 'Switzerland', 'Russia', 'Denmark',
      'Norway', 'Poland', 'Mexico', 'Argentina', 'South Korea', 'Finland'
    ]);

    const decades = ref([2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950, 1940, 1930, 1920]);

    const displayedFormats = computed(() => formats.value.slice(0, 12));
    const displayedCountries = computed(() => countries.value.slice(0, 12));

    const toggleSection = (section) => {
      if (section === 'format') formatExpanded.value = !formatExpanded.value;
      if (section === 'country') countryExpanded.value = !countryExpanded.value;
      if (section === 'decade') decadeExpanded.value = !decadeExpanded.value;
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

    const openFormatsPopup = () => {
      showFormatsPopup.value = true;
    };

    const openCountriesPopup = () => {
      showCountriesPopup.value = true;
    };

    const emitFilterChange = () => {
      emit('filter-change', {
        formats: selectedFormats.value,
        countries: selectedCountries.value,
        decades: selectedDecades.value,
      });
    };

    watch([selectedFormats, selectedCountries, selectedDecades], () => {
      emitFilterChange();
    }, { deep: true });

    return {
      formatExpanded,
      countryExpanded,
      decadeExpanded,
      selectedFormats,
      selectedCountries,
      selectedDecades,
      showFormatsPopup,
      showCountriesPopup,
      formats,
      countries,
      decades,
      displayedFormats,
      displayedCountries,
      toggleSection,
      toggleFormat,
      toggleCountry,
      toggleDecade,
      openFormatsPopup,
      openCountriesPopup,
    };
  },
};
</script>

<style scoped>
.filter-sidebar {
  position: fixed;
  left: -280px;
  top: 70px;
  width: 280px;
  height: calc(100vh - 70px);
  background: white;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;
  padding: 20px;
}

.filter-sidebar.open {
  left: 0;
}

.filter-section {
  margin-bottom: 24px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}

.filter-section:last-child {
  border-bottom: none;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  margin-bottom: 12px;
  user-select: none;
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
  transition: transform 0.2s;
}

.toggle-btn:hover {
  transform: scale(1.2);
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
  border-radius: 16px;
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
  font-size: 13px;
  color: #717171;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  text-decoration: underline;
  transition: color 0.2s;
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

@media (max-width: 768px) {
  .filter-sidebar {
    width: 240px;
    left: -240px;
  }
}
</style>
