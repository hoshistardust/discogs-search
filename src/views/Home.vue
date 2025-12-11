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

    <!-- Main Content -->
    <div class="main-content">
      <!-- Two-column search layout -->
      <div class="search-columns">
        <!-- Album/Artist/Label Search Section -->
        <div class="search-section">
          <p class="section-label">
            Search for listings of Releases, Artists, or Music Labels
          </p>
          <div class="search-wrapper">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search for Releases, Artists, or Labels"
              class="search-field"
              @keyup.enter="performSearch"
            />
            <span class="material-symbols-outlined search-icon" @click="performSearch">
              search
            </span>
          </div>
        </div>

        <!-- Vertical Divider -->
        <div class="vertical-divider"></div>

        <!-- Genre/Style Discovery Section -->
        <div class="discovery-section">
          <p class="section-label">
            Discover new music based on genres and styles
          </p>

          <div class="discovery-inputs">
            <!-- Genres Dropdown -->
            <div class="input-group">
              <label class="input-label">Choose genres</label>
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
            </div>

            <!-- Styles Dropdown -->
            <div class="input-group">
              <label class="input-label">Choose styles</label>
              <div class="dropdown-row">
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

      <!-- Popular Albums Section -->
      <div class="popular-section">
        <h2 class="section-title">Most popular albums of 2025</h2>
        <div v-if="loadingAlbums" class="loading">Loading albums...</div>
        <div v-else-if="popularAlbums.length > 0" class="albums-container">
          <a
            v-for="album in popularAlbums"
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
                <span>{{ album.year || "N/A" }}</span>
                <span v-if="album.have">+ {{ album.have }} in collection</span>
              </div>
            </div>
          </a>
        </div>
        <div v-else class="no-results">No albums found</div>
      </div>

      <!-- Popular Artists Section -->
      <div class="popular-section">
        <h2 class="section-title">Most popular artists of 2025</h2>
        <div v-if="loadingArtists" class="loading">Loading artists...</div>
        <div v-else-if="popularArtists.length > 0" class="artists-container">
          <a
            v-for="artist in popularArtists"
            :key="artist.name"
            :href="`https://www.discogs.com/search/?q=${encodeURIComponent(artist.name)}&type=artist`"
            target="_blank"
            rel="noopener noreferrer"
            class="artist-card"
          >
            <div class="artist-image">
              <img
                v-if="artist.image"
                :src="artist.image"
                :alt="artist.name"
                @error="handleImageError"
              />
            </div>
            <div class="artist-info">
              <p class="artist-name">{{ artist.name || "Unknown Artist" }}</p>
              <p class="artist-type">Artist</p>
            </div>
          </a>
        </div>
        <div v-else class="no-results">No artists found</div>
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
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import MultiSelectPopup from "../components/MultiSelectPopup.vue";
import {
  getGenres,
  getStyles,
  getTop2025Albums,
  getTop2025Artists,
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
    const popularArtists = ref([]);
    const loadingAlbums = ref(false);
    const loadingArtists = ref(false);

    onMounted(async () => {
      availableGenres.value = getGenres();
      availableStyles.value = getStyles();

      loadingAlbums.value = true;
      loadingArtists.value = true;

      try {
        popularAlbums.value = await getTop2025Albums();
      } catch (error) {
        console.error("Failed to load popular albums:", error);
      } finally {
        loadingAlbums.value = false;
      }

      try {
        popularArtists.value = await getTop2025Artists();
      } catch (error) {
        console.error("Failed to load popular artists:", error);
      } finally {
        loadingArtists.value = false;
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
      popularArtists,
      loadingAlbums,
      loadingArtists,
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
  padding: 82px 80px 82px 200px;
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

/* Main Content */
.main-content {
  padding: 40px 80px 80px 200px;
  max-width: 1440px;
  margin: 0 auto;
  position: relative;
}

/* Two-column search layout */
.search-columns {
  display: flex;
  align-items: flex-start;
  gap: 60px;
  margin-bottom: 40px;
}

/* Search Section */
.search-section {
  flex: 0 0 auto;
  width: 413px;
}

.section-label {
  font-family: "Inria Sans", sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 24px 0;
  line-height: 1.3;
}

.search-wrapper {
  position: relative;
  background: #ffffff;
  border: 2px solid #000000;
  border-radius: 20px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 14px 16px;
  width: 100%;
}

.search-field {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  color: #000000;
  border: none;
  outline: none;
  background: transparent;
  flex: 1;
  line-height: normal;
  font-style: normal;
  font-weight: 400;
}

.search-field::placeholder {
  color: #717171;
}

.search-icon {
  flex-shrink: 0;
  font-size: 18px;
  color: #717171;
  cursor: pointer;
  font-variation-settings: 'wght' 400;
}

/* Vertical Divider */
.vertical-divider {
  width: 2px;
  background-color: #000000;
  align-self: stretch;
  min-height: 200px;
  flex-shrink: 0;
}

/* Horizontal Divider */
.horizontal-divider {
  width: 100%;
  height: 2px;
  background-color: #000000;
  margin-bottom: 40px;
}

/* Discovery Section */
.discovery-section {
  flex: 1;
  max-width: 500px;
}

.discovery-inputs {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  color: #000000;
}

.dropdown-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: nowrap;
}

.dropdown-wrapper {
  background: #ffffff;
  border: 2px solid #000000;
  border-radius: 20px;
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

.genre-dropdown {
  width: 100%;
}

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
  border-radius: 50%;
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

.discover-button:hover:not(:disabled) {
  background: #333333;
}

.discover-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

/* Popular Sections */
.popular-section {
  margin-bottom: 60px;
}

.section-title {
  font-family: "Inria Sans", sans-serif;
  font-size: 20px;
  color: #000000;
  margin: 0 0 20px 0;
  font-weight: 400;
}

.albums-container,
.artists-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 16px;
  margin-left: -200px;
  padding-left: 200px;
  margin-right: -80px;
  padding-right: 80px;
  scrollbar-width: thin;
  scrollbar-color: #cccccc transparent;
  -webkit-overflow-scrolling: touch;
}

.albums-container::-webkit-scrollbar,
.artists-container::-webkit-scrollbar {
  height: 8px;
}

.albums-container::-webkit-scrollbar-track,
.artists-container::-webkit-scrollbar-track {
  background: transparent;
}

.albums-container::-webkit-scrollbar-thumb,
.artists-container::-webkit-scrollbar-thumb {
  background: #cccccc;
  border-radius: 4px;
}

.albums-container::-webkit-scrollbar-thumb:hover,
.artists-container::-webkit-scrollbar-thumb:hover {
  background: #999999;
}

.album-card,
.artist-card {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s;
}

.album-card:hover,
.artist-card:hover {
  transform: translateY(-4px);
}

.album-cover,
.artist-image {
  width: 240px;
  height: 240px;
  background: #d9d9d9;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.artist-image {
  border-radius: 50%;
}

.album-cover img,
.artist-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-info,
.artist-info {
  width: 185px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.album-title,
.artist-name {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #000000;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-artist,
.artist-type {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  color: #000000;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist-type {
  color: #717171;
}

.album-meta {
  display: flex;
  gap: 8px;
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  color: #717171;
}

.loading,
.no-results {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  color: #717171;
  padding: 20px 0;
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

  .albums-container,
  .artists-container {
    margin-left: -100px;
    padding-left: 100px;
    margin-right: -40px;
    padding-right: 40px;
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

  .albums-container,
  .artists-container {
    margin-left: -20px;
    padding-left: 20px;
    margin-right: -20px;
    padding-right: 20px;
  }

  .section-label {
    font-size: 20px;
  }

  .dropdown-row {
    flex-direction: column;
    align-items: stretch;
  }

  .discover-button {
    width: 100%;
    border-radius: 20px;
  }

  .album-cover,
  .artist-image {
    width: 200px;
    height: 200px;
  }

  .album-info,
  .artist-info {
    width: 160px;
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

  .album-cover,
  .artist-image {
    width: 160px;
    height: 160px;
  }

  .album-info,
  .artist-info {
    width: 140px;
  }

  .album-title,
  .artist-name,
  .album-artist,
  .artist-type,
  .album-meta {
    font-size: 14px;
  }
}
</style>
