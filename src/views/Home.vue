<template>
  <div class="home-page">
    <!-- Hero Section with Half Circle -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Discogs Search</h1>
        <p class="hero-subtitle">
          An implementation project exploring better discogs search interface
        </p>
      </div>
      <div class="hero-decoration">
        <svg viewBox="0 0 302 302" class="half-circle">
          <circle cx="151" cy="151" r="151" fill="#FFFFFF" />
          <circle cx="151" cy="151" r="131" fill="#000000" />
          <circle cx="151" cy="151" r="40" fill="#FF4444" />
          <circle cx="151" cy="151" r="15" fill="#FFFFFF" />
        </svg>
      </div>
    </div>

    <!-- Sticky Search Section -->
    <div class="sticky-search-container">
      <div class="search-content">
        <!-- Two-column search layout -->
        <div class="search-columns">
          <!-- Album/Artist/Label Search Section -->
          <div class="search-section">
            <p class="section-label">
              Search for listings of Releases, Artists, or Music Labels
            </p>
            <div class="search-with-button">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search for Releases, Artists, or Labels"
                class="search-field-solo"
                @keyup.enter="performSearch"
              />
              <button class="search-button" @click="performSearch">
                <span class="material-symbols-outlined">search</span>
              </button>
            </div>
          </div>

        <!-- Vertical Divider -->
        <div class="vertical-divider"></div>

        <!-- Genre/Style Discovery Section -->
        <div class="discovery-section">
          <p class="section-label">
            Discover music based on genres and styles
          </p>

          <div class="discovery-inputs">
            <!-- Labels Row -->
            <div class="labels-row">
              <label class="input-label">Choose genres</label>
              <label class="input-label">Choose styles</label>
              <span class="button-spacer"></span>
            </div>

            <!-- Dropdowns and Button Row -->
            <div class="dropdowns-row">
              <!-- Genres Dropdown -->
              <div class="dropdown-wrapper genre-dropdown" @click="openGenresPopup">
                <div class="dropdown-display">
                  <div v-if="selectedGenres.length === 0" class="placeholder">
                    Genres
                  </div>
                  <div v-else class="tags-container">
                    <span
                      v-for="genre in selectedGenres"
                      :key="genre"
                      class="tag"
                    >
                      {{ genre }}
                      <button
                        class="tag-remove"
                        @click.stop="removeGenre(genre)"
                        aria-label="Remove genre"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                </div>
                <svg
                  class="dropdown-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>

              <!-- Styles Dropdown -->
              <div class="dropdown-wrapper style-dropdown" @click="openStylesPopup">
                  <div class="dropdown-display">
                    <div v-if="selectedStyles.length === 0" class="placeholder">
                      Styles
                    </div>
                    <div v-else class="tags-container">
                      <span
                        v-for="style in selectedStyles"
                        :key="style"
                        class="tag"
                      >
                        {{ style }}
                        <button
                          class="tag-remove"
                          @click.stop="removeStyle(style)"
                          aria-label="Remove style"
                        >
                          ×
                        </button>
                      </span>
                    </div>
                  </div>
                  <svg
                    class="dropdown-icon"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
              </div>

              <!-- Discover Button -->
              <button
                class="discover-button"
                @click="performDiscoverySearch"
                :disabled="selectedGenres.length === 0 && selectedStyles.length === 0"
              >
                <span class="material-symbols-outlined">search</span>
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- Horizontal Divider -->
      <div class="horizontal-divider"></div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Popular Albums Section -->
      <div class="popular-section">
        <h2 class="section-title">Top 100 albums of 2025</h2>
        <div v-if="loadingAlbums" class="loading">Loading albums...</div>
        <div v-else-if="popularAlbums.length > 0" class="albums-grid">
          <a
            v-for="album in displayedAlbums"
            :key="album.id"
            :href="`https://www.discogs.com/release/${album.id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="album-card"
          >
            <div class="album-cover">
              <img
                v-if="album.cover_image"
                :src="album.cover_image"
                :alt="album.title"
                @error="handleImageError"
              />
            </div>
            <div class="album-info">
              <p class="album-title">{{ album.title || "Unknown Album" }}</p>
              <p class="album-artist">{{ album.artist || "Unknown Artist" }}</p>
              <div class="album-meta">
                <span class="album-year">{{ album.year || "N/A" }}</span>
                <span v-if="album.have" class="album-collection">
                  <span class="material-symbols-outlined">favorite</span>{{ album.have }}
                </span>
              </div>
            </div>
          </a>
        </div>
        <!-- Loading indicator when loading more -->
        <div v-if="hasMoreAlbums" class="loading-more" ref="loadMoreTrigger">
          Loading more...
        </div>
        <div v-else-if="popularAlbums.length === 0" class="no-results">No albums found</div>
      </div>
    </div>

    <!-- MultiSelect Popups -->
    <MultiSelectPopup
      :is-open="showGenresPopup"
      title="Choose Genres"
      :options="availableGenres"
      v-model="selectedGenres"
      @close="showGenresPopup = false"
    />

    <MultiSelectPopup
      :is-open="showStylesPopup"
      title="Choose Styles"
      :options="availableStyles"
      v-model="selectedStyles"
      :searchable="true"
      :use-columns="true"
      @close="showStylesPopup = false"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import MultiSelectPopup from "../components/MultiSelectPopup.vue";
import {
  getGenres,
  getStyles,
  getTop2025Albums,
} from "../services/discogs.js";

export default {
  name: "Home",
  components: {
    MultiSelectPopup,
  },
  setup() {
    const router = useRouter();

    const searchQuery = ref("");
    const selectedGenres = ref([]);
    const selectedStyles = ref([]);
    const showGenresPopup = ref(false);
    const showStylesPopup = ref(false);
    const availableGenres = ref([]);
    const availableStyles = ref([]);
    const popularAlbums = ref([]);
    const loadingAlbums = ref(false);
    const displayCount = ref(12); // Show 12 items (3 rows) at a time
    const loadMoreTrigger = ref(null);
    const observer = ref(null);

    const displayedAlbums = computed(() => {
      return popularAlbums.value.slice(0, displayCount.value);
    });

    const hasMoreAlbums = computed(() => {
      return displayCount.value < popularAlbums.value.length;
    });

    const loadMoreAlbums = () => {
      displayCount.value += 12; // Load 3 more rows (12 items)
    };

    const setupScrollObserver = () => {
      observer.value = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && hasMoreAlbums.value) {
              loadMoreAlbums();
            }
          });
        },
        {
          rootMargin: "100px", // Start loading 100px before reaching the trigger
          threshold: 0.1,
        }
      );

      if (loadMoreTrigger.value) {
        observer.value.observe(loadMoreTrigger.value);
      }
    };

    onMounted(async () => {
      availableGenres.value = getGenres();
      availableStyles.value = getStyles();

      loadingAlbums.value = true;

      try {
        popularAlbums.value = await getTop2025Albums();
        // Wait for DOM to update, then setup scroll observer
        await nextTick();
        setupScrollObserver();
      } catch (error) {
        console.error("Failed to load popular albums:", error);
      } finally {
        loadingAlbums.value = false;
      }
    });

    onUnmounted(() => {
      if (observer.value) {
        observer.value.disconnect();
      }
    });

    const performSearch = () => {
      if (searchQuery.value.trim()) {
        router.push({
          path: "/results",
          query: { q: searchQuery.value },
        });
      }
    };

    const performDiscoverySearch = () => {
      if (selectedGenres.value.length > 0 || selectedStyles.value.length > 0) {
        router.push({
          path: "/discover",
          query: {
            genres: selectedGenres.value.join(","),
            styles: selectedStyles.value.join(","),
          },
        });
      }
    };

    const openGenresPopup = () => {
      showGenresPopup.value = true;
    };

    const openStylesPopup = () => {
      showStylesPopup.value = true;
    };

    const removeGenre = (genre) => {
      selectedGenres.value = selectedGenres.value.filter((g) => g !== genre);
    };

    const removeStyle = (style) => {
      selectedStyles.value = selectedStyles.value.filter((s) => s !== style);
    };

    const handleImageError = (e) => {
      e.target.style.display = "none";
    };

    return {
      searchQuery,
      selectedGenres,
      selectedStyles,
      showGenresPopup,
      showStylesPopup,
      availableGenres,
      availableStyles,
      popularAlbums,
      loadingAlbums,
      displayedAlbums,
      hasMoreAlbums,
      loadMoreAlbums,
      loadMoreTrigger,
      performSearch,
      performDiscoverySearch,
      openGenresPopup,
      openStylesPopup,
      removeGenre,
      removeStyle,
      handleImageError,
    };
  },
};
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  position: relative;
  background: #000000;
  padding: 82px 200px;
  overflow: hidden;
  margin-top: 82px;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
}

.hero-title {
  font-family: "Inria Sans", sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: white;
  margin: 0 0 16px 0;
}

.hero-subtitle {
  font-family: "Inria Sans", sans-serif;
  font-size: 24px;
  color: white;
  margin: 0;
  line-height: 1.5;
}

.hero-decoration {
  position: absolute;
  right: -151px;
  top: 50%;
  transform: translateY(-50%);
  width: 302px;
  height: 302px;
  z-index: 1;
}

.half-circle {
  width: 100%;
  height: 100%;
}

/* Sticky Search Container */
.sticky-search-container {
  position: sticky;
  top: 0;
  background: #ffffff;
  z-index: 50;
  padding-bottom: 0;
}

.search-content {
  padding: 28px 200px;
  max-width: 1440px;
  margin: 0 auto;
  position: relative;
}

/* Two-column search layout */
.search-columns {
  display: grid;
  grid-template-columns: minmax(450px, 1fr) 2px minmax(450px, 1fr);
  gap: 60px;
  position: relative;
  justify-content: start;
}

/* Main Content */
.main-content {
  padding: 0 200px 80px 200px;
  max-width: 1440px;
  margin: 0 auto;
  position: relative;
}

/* Search Section */
.search-section {
  width: 100%;
  max-width: 100%;
  justify-self: start;
  grid-column: 1;
  display: flex;
  flex-direction: column;
}

.section-label {
  font-family: "Inria Sans", sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 24px 0;
  line-height: 1.3;
  white-space: normal;
}

.search-section .section-label {
  margin-bottom: auto;
  padding-bottom: 24px;
}

.search-with-button {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-field-solo {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  color: #000000;
  background: #ffffff;
  border: 2px solid #000000;
  border-radius: 0;
  box-sizing: border-box;
  height: 44px;
  padding: 14px 16px;
  flex: 1;
  outline: none;
  line-height: normal;
  font-style: normal;
  font-weight: 400;
}

.search-field-solo::placeholder {
  color: #717171;
}

.search-button {
  background: #000000;
  border: none;
  border-radius: 0;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ffffff;
  transition: background-color 0.2s;
}

.search-button:hover {
  background: #333333;
}

/* Vertical Divider */
.vertical-divider {
  width: 2px;
  background-color: #000000;
  grid-column: 2;
  position: relative;
  top: -28px;
  height: calc(100% + 56px);
  flex-shrink: 0;
}

/* Horizontal Divider */
.horizontal-divider {
  width: 100%;
  height: 2px;
  background-color: #000000;
}

/* Discovery Section */
.discovery-section {
  width: 100%;
  max-width: 100%;
  justify-self: start;
  grid-column: 3;
  display: flex;
  flex-direction: column;
}

.discovery-section .section-label {
  margin-bottom: auto;
  padding-bottom: 24px;
}

.discovery-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.labels-row {
  display: flex;
  gap: 16px;
}

.input-label {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  color: #000000;
  flex: 1;
}

.button-spacer {
  width: 44px;
  flex-shrink: 0;
}

.dropdowns-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: nowrap;
}

.dropdown-wrapper {
  background: #ffffff;
  border: 2px solid #000000;
  border-radius: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 8px 16px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.dropdown-wrapper:hover {
  border-color: #333333;
}

.genre-dropdown,
.style-dropdown {
  flex: 1;
}

.dropdown-display {
  flex: 1;
  min-height: 24px;
  display: flex;
  align-items: center;
}

.placeholder {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  color: #717171;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
}

.tag {
  background: #f0f0f0;
  border-radius: 12px;
  padding: 4px 8px;
  font-family: "Inria Sans", sans-serif;
  font-size: 13px;
  color: #000000;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tag-remove {
  background: none;
  border: none;
  color: #717171;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-remove:hover {
  color: #000000;
}

.dropdown-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: #717171;
}

.discover-button {
  background: #000000;
  border: none;
  border-radius: 0;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ffffff;
  transition: background-color 0.2s;
}

.discover-button svg {
  color: #ffffff;
}

.discover-button:hover {
  background: #333333;
}

/* Popular Sections */
.popular-section {
  margin-top: 16px;
  margin-bottom: 60px;
}

.section-title {
  font-family: "Inria Sans", sans-serif;
  font-size: 20px;
  color: #000000;
  margin: 0 0 20px 0;
  font-weight: 700;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
}

.album-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.album-cover {
  width: 100%;
  aspect-ratio: 1;
  background: #d9d9d9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.album-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  width: 100%;
}

.album-title {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #000000;
  margin: 0;
  padding-bottom: 6px;
  border-bottom: 2px solid #000000;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.album-artist {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  color: #000000;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  min-width: 0;
}

.album-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  color: #000000;
}

.album-year {
  text-align: left;
}

.album-collection {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.album-collection .material-symbols-outlined {
  font-size: 16px;
  color: #000000;
  font-variation-settings: 'FILL' 0, 'wght' 400;
}

.loading,
.no-results,
.loading-more {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  color: #717171;
  padding: 20px 0;
  text-align: center;
}

.loading-more {
  margin-top: 40px;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .search-columns {
    gap: 40px;
  }

  .search-section {
    width: 350px;
  }

  .discovery-section {
    max-width: 400px;
  }
}

@media (max-width: 1024px) {
  .hero-section {
    padding: 60px 40px 60px 100px;
  }

  .hero-decoration {
    right: -151px;
  }

  .main-content {
    padding: 40px 40px 60px 100px;
  }

  .search-columns {
    flex-direction: column;
    gap: 40px;
  }

  .search-section {
    width: 100%;
    max-width: 500px;
  }

  .discovery-section {
    max-width: 500px;
  }

  .vertical-divider {
    display: none;
  }

  .horizontal-divider {
    margin-top: 0;
  }

  .albums-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 40px 20px;
  }

  .hero-title {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 18px;
  }

  .hero-decoration {
    right: -151px;
    opacity: 0.5;
  }

  .main-content {
    padding: 30px 20px;
  }

  .section-label {
    font-size: 20px;
  }

  .dropdowns-row {
    flex-direction: column;
    align-items: stretch;
  }

  .discover-button {
    width: 100%;
    border-radius: 20px;
  }

  .albums-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 28px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .section-label {
    font-size: 18px;
  }

  .albums-grid {
    grid-template-columns: 1fr;
  }

  .album-title,
  .album-artist,
  .album-meta {
    font-size: 14px;
  }
}
</style>
