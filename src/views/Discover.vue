<template>
  <div class="discover-page">
    <div class="content-wrapper">
      <!-- Search Info -->
      <div class="search-info">
        <h1 class="page-title">Discover Music</h1>

        <!-- Genre Dropdown -->
        <div class="genre-section">
          <label class="input-label">Genres</label>
          <div class="dropdown-button-row">
            <div class="dropdown-wrapper" @click="openGenresPopup">
              <div class="dropdown-display">
                <div v-if="selectedGenres.length === 0" class="placeholder">
                  Choose genres
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
            <button
              class="search-button"
              @click="fetchResults"
              :disabled="selectedGenres.length === 0"
            >
              <span class="material-symbols-outlined">search</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading">Discovering music...</div>

      <!-- Error State -->
      <div v-if="error" class="error">{{ error }}</div>

      <!-- Results Section -->
      <div v-if="!loading && releases.length > 0" class="section">
        <div class="results-header">
          <h2 class="section-title">
            Found {{ totalResults }} releases
          </h2>

          <!-- Sort by dropdown -->
          <div class="sort-wrapper">
            <label class="sort-label">Sort by</label>
            <div class="sort-select-wrapper">
              <select v-model="sortBy" class="sort-select">
                <option value="relevance">Relevance</option>
                <option value="year-desc">Year (Newest)</option>
                <option value="year-asc">Year (Oldest)</option>
                <option value="title">Title (A-Z)</option>
              </select>
              <span class="material-symbols-outlined sort-arrow">keyboard_arrow_down</span>
            </div>
          </div>
        </div>

        <div class="albums-container">
          <div
            v-for="release in paginatedReleases"
            :key="release.id"
            class="album-card"
          >
            <a
              :href="`https://www.discogs.com${release.uri}`"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div class="album-cover-wrapper">
                <img
                  v-if="release.cover_image"
                  :src="release.cover_image"
                  :alt="release.title"
                  class="album-cover"
                  @error="handleImageError"
                />
                <div v-else class="album-cover placeholder"></div>
              </div>
            </a>
            <div class="album-info">
              <div class="album-title">{{ release.title }}</div>
              <div class="album-meta">
                <span class="meta-year" v-if="release.year">{{ release.year }}</span>
                <span class="meta-format" v-if="release.format && release.format.length">
                  {{ release.format[0] }}
                </span>
              </div>
              <div v-if="(release.genre && release.genre.length > 0) || (release.style && release.style.length > 0)" class="album-tags">
                <span
                  v-for="(genre, idx) in release.genre || []"
                  :key="'genre-' + idx"
                  class="genre-badge"
                >
                  {{ genre }}
                </span>
                <span
                  v-for="(style, idx) in release.style || []"
                  :key="'style-' + idx"
                  class="genre-badge"
                >
                  {{ style }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            v-if="currentPage > 1"
            @click="goToPage(currentPage - 1)"
            class="pagination-btn"
          >
            Previous
          </button>
          <span v-else class="pagination-spacer"></span>
          <span class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            v-if="currentPage < totalPages"
            @click="goToPage(currentPage + 1)"
            class="pagination-btn"
          >
            Next
          </button>
          <span v-else class="pagination-spacer"></span>
        </div>
      </div>

      <!-- No Results -->
      <div
        v-if="
          !loading &&
          !error &&
          releases.length === 0 &&
          hasSearched
        "
        class="no-results"
      >
        <p>No releases found for the selected genres and styles.</p>
        <button class="back-btn" @click="goHome">Try Different Selections</button>
      </div>
    </div>

    <!-- MultiSelect Popup -->
    <MultiSelectPopup
      :is-open="showGenresPopup"
      title="Choose Genres"
      :options="availableGenres"
      v-model="selectedGenres"
      :searchable="true"
      :use-columns="true"
      @close="closeGenresPopup"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import MultiSelectPopup from "../components/MultiSelectPopup.vue";
import { searchByGenreStyle, getGenres, getStyles } from "../services/discogs.js";

export default {
  name: "Discover",
  components: {
    MultiSelectPopup,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const selectedGenres = ref([]);
    const selectedStyles = ref([]);
    const releases = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const hasSearched = ref(false);
    const totalResults = ref(0);
    const showGenresPopup = ref(false);
    const availableGenres = ref([]);
    const sortBy = ref("relevance");
    const currentPage = ref(1);
    const itemsPerPage = 24;

    const fetchResults = async () => {
      if (selectedGenres.value.length === 0) {
        return;
      }

      loading.value = true;
      error.value = null;
      hasSearched.value = true;
      currentPage.value = 1; // Reset to first page on new search

      try {
        // Separate selected items into actual genres and styles
        const actualGenres = getGenres();
        const actualStyles = getStyles();

        const genresForApi = selectedGenres.value.filter(item =>
          actualGenres.includes(item)
        );
        const stylesForApi = selectedGenres.value.filter(item =>
          actualStyles.includes(item)
        );

        const data = await searchByGenreStyle(
          genresForApi,
          stylesForApi,
          100 // Fetch more results for better pagination
        );

        releases.value = data.results;
        totalResults.value = data.total;
      } catch (err) {
        error.value = err.message || "Failed to fetch results";
        console.error("Discovery search error:", err);
      } finally {
        loading.value = false;
      }
    };

    // Sorted releases
    const sortedReleases = computed(() => {
      const sorted = [...releases.value];

      if (sortBy.value === "year-desc") {
        sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
      } else if (sortBy.value === "year-asc") {
        sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
      } else if (sortBy.value === "title") {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
      }
      // "relevance" keeps original API order

      return sorted;
    });

    // Paginated releases
    const paginatedReleases = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return sortedReleases.value.slice(start, end);
    });

    // Total pages
    const totalPages = computed(() => {
      return Math.ceil(sortedReleases.value.length / itemsPerPage);
    });

    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    const handleImageError = (e) => {
      e.target.style.display = "none";
    };

    const goHome = () => {
      router.push("/");
    };

    const removeGenre = (genre) => {
      selectedGenres.value = selectedGenres.value.filter((g) => g !== genre);
      // Re-fetch results with updated genres
      fetchResults();
    };

    const openGenresPopup = () => {
      showGenresPopup.value = true;
    };

    const closeGenresPopup = () => {
      showGenresPopup.value = false;
      // Re-fetch results when popup closes if genres changed
      if (selectedGenres.value.length > 0) {
        fetchResults();
      }
    };

    onMounted(() => {
      // Combine genres and styles into one list
      const genres = getGenres();
      const styles = getStyles();
      availableGenres.value = [...genres, ...styles].sort();
      const genresParam = route.query.genres;
      const stylesParam = route.query.styles;

      if (genresParam) {
        selectedGenres.value = genresParam.split("|").filter((g) => g.trim());
      }

      if (stylesParam) {
        selectedStyles.value = stylesParam.split("|").filter((s) => s.trim());
      }

      fetchResults();
    });

    return {
      selectedGenres,
      selectedStyles,
      releases,
      loading,
      error,
      hasSearched,
      totalResults,
      handleImageError,
      goHome,
      removeGenre,
      showGenresPopup,
      availableGenres,
      openGenresPopup,
      closeGenresPopup,
      fetchResults,
      sortBy,
      paginatedReleases,
      currentPage,
      totalPages,
      goToPage,
    };
  },
};
</script>

<style scoped>
.discover-page {
  min-height: calc(100vh - 70px);
  padding: 0 20px 40px 20px;
  margin-top: 70px;
}

.content-wrapper {
  max-width: 85%;
  margin: 0 auto;
  border-left: 2px solid #000000;
  border-right: 2px solid #000000;
  padding: 40px 40px 0 40px;
}

.search-info {
  margin-bottom: 40px;
}

.page-title {
  font-family: "Inria Sans", sans-serif;
  font-size: 36px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 16px 0;
}

.title-divider {
  height: 2px;
  background: #000000;
  margin-bottom: 20px;
}

.genre-section {
  margin-bottom: 40px;
  max-width: 50%;
}

@media (max-width: 1024px) {
  .genre-section {
    max-width: 70%;
  }
}

@media (max-width: 768px) {
  .genre-section {
    max-width: 100%;
  }
}

.input-label {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  color: #000000;
  margin-bottom: 8px;
  display: block;
}

.dropdown-button-row {
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
  padding: 6px 16px;
  cursor: pointer;
  transition: border-color 0.2s;
  flex: 1;
}

.dropdown-wrapper:hover {
  border-color: #333333;
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

.dropdown-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
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

.search-button svg {
  color: #ffffff;
}

.search-button:hover {
  background: #333333;
}

.search-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.tag {
  background: #000000;
  color: #ffffff;
  border-radius: 0;
  padding: 4px 8px;
  font-family: "Inria Sans", sans-serif;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tag-remove {
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.tag-remove:hover {
  opacity: 1;
}

.loading,
.error,
.no-results {
  text-align: center;
  font-family: "Inria Sans", sans-serif;
  font-size: 18px;
  color: #717171;
  padding: 60px 20px;
}

.error {
  color: #dc3545;
}

.no-results p {
  margin: 0 0 20px 0;
}

.back-btn {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  background: #000000;
  border: none;
  border-radius: 20px;
  padding: 12px 32px;
  cursor: pointer;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #333333;
}

.section {
  margin-bottom: 60px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-title {
  font-family: "Inria Sans", sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #000000;
  margin: 0;
}

.sort-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sort-label {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  color: #000000;
  white-space: nowrap;
}

.sort-select-wrapper {
  position: relative;
  display: inline-block;
}

.sort-select {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  color: #000000;
  background: #ffffff;
  border: 2px solid #000000;
  border-radius: 0;
  padding: 8px 36px 8px 12px;
  cursor: pointer;
  appearance: none;
  min-width: 160px;
}

.sort-select:focus {
  outline: none;
  border-color: #333333;
}

.sort-arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #000000;
  font-size: 24px;
}

.albums-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 30px;
}

.album-card {
  display: flex;
  flex-direction: column;
}

.album-cover-wrapper {
  width: 100%;
  aspect-ratio: 1;
  margin-bottom: 12px;
  border-radius: 0;
  overflow: hidden;
}

.album-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-cover.placeholder {
  background: #d9d9d9;
}

.album-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  height: 44px !important;
  max-height: 44px !important;
  overflow: hidden !important;
  text-overflow: ellipsis;
  display: -webkit-box !important;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical !important;
  word-break: break-word;
}

.album-meta {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  color: #000000;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-year {
  text-align: left;
}

.meta-format {
  text-align: right;
}

.album-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.genre-badge {
  background: #ffffff;
  border: 1px solid #000000;
  border-radius: 0;
  padding: 4px 8px;
  font-family: "Inria Sans", sans-serif;
  font-size: 12px;
  color: #000000;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
  padding: 20px 0;
}

.pagination-btn {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  background: #ffffff;
  border: 2px solid #000000;
  border-radius: 0;
  padding: 8px 20px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #000000;
  color: #ffffff;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-spacer {
  width: 80px;
}

.pagination-info {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  color: #000000;
  min-width: 120px;
  text-align: center;
}

@media (max-width: 1024px) {
  .albums-container {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    max-width: 95%;
    padding-left: 20px;
    padding-right: 20px;
  }

  .page-title {
    font-size: 28px;
  }

  .dropdown-button-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-button {
    width: 100%;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .sort-wrapper {
    width: 100%;
  }

  .sort-select {
    width: 100%;
  }

  .albums-container {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }

  .album-title {
    font-size: 14px;
  }

  .album-meta {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    padding-left: 12px;
    padding-right: 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .albums-container {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
}
</style>
