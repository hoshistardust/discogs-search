<template>
  <div class="discover-page">
    <div class="content-wrapper">
      <!-- Search Info -->
      <div class="search-info">
        <h1 class="page-title">Discover Music</h1>
        <div v-if="selectedGenres.length > 0 || selectedStyles.length > 0" class="filters">
          <div v-if="selectedGenres.length > 0" class="filter-section">
            <span class="filter-label">Genres:</span>
            <div class="tags">
              <span v-for="genre in selectedGenres" :key="genre" class="tag">
                {{ genre }}
              </span>
            </div>
          </div>
          <div v-if="selectedStyles.length > 0" class="filter-section">
            <span class="filter-label">Styles:</span>
            <div class="tags">
              <span v-for="style in selectedStyles" :key="style" class="tag">
                {{ style }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading">Discovering music...</div>

      <!-- Error State -->
      <div v-if="error" class="error">{{ error }}</div>

      <!-- Results Section -->
      <div v-if="!loading && releases.length > 0" class="section">
        <h2 class="section-title">
          Found {{ totalResults }} releases
        </h2>
        <div class="albums-container">
          <div
            v-for="release in releases"
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
                <span v-if="release.year">{{ release.year }}</span>
                <span v-if="release.format && release.format.length > 0">
                  {{ release.format.join(", ") }}
                </span>
              </div>
              <div v-if="release.genre && release.genre.length > 0" class="album-genres">
                <span
                  v-for="(genre, idx) in release.genre.slice(0, 2)"
                  :key="idx"
                  class="genre-badge"
                >
                  {{ genre }}
                </span>
              </div>
            </div>
          </div>
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
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { searchByGenreStyle } from "../services/discogs.js";

export default {
  name: "Discover",
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

    const fetchResults = async () => {
      if (
        selectedGenres.value.length === 0 &&
        selectedStyles.value.length === 0
      ) {
        return;
      }

      loading.value = true;
      error.value = null;
      hasSearched.value = true;

      try {
        const data = await searchByGenreStyle(
          selectedGenres.value,
          selectedStyles.value,
          50
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

    const handleImageError = (e) => {
      e.target.style.display = "none";
    };

    const goHome = () => {
      router.push("/");
    };

    onMounted(() => {
      const genresParam = route.query.genres;
      const stylesParam = route.query.styles;

      if (genresParam) {
        selectedGenres.value = genresParam.split(",").filter((g) => g.trim());
      }

      if (stylesParam) {
        selectedStyles.value = stylesParam.split(",").filter((s) => s.trim());
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
    };
  },
};
</script>

<style scoped>
.discover-page {
  min-height: calc(100vh - 70px);
  padding: 40px 20px;
  margin-top: 70px;
}

.content-wrapper {
  max-width: 85%;
  margin: 0 auto;
}

.search-info {
  margin-bottom: 40px;
}

.page-title {
  font-family: "Inria Sans", sans-serif;
  font-size: 36px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 20px 0;
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #000000;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  background: #000000;
  color: white;
  border-radius: 12px;
  padding: 6px 12px;
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
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

.section-title {
  font-family: "Inria Sans", sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #000000;
  margin: 0 0 30px 0;
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
  border-radius: 8px;
  overflow: hidden;
}

.album-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.album-cover.placeholder {
  background: #d9d9d9;
}

.album-cover:hover {
  transform: scale(1.05);
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
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.album-meta {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  color: #717171;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.album-genres {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.genre-badge {
  background: #f0f0f0;
  border-radius: 8px;
  padding: 4px 8px;
  font-family: "Inria Sans", sans-serif;
  font-size: 12px;
  color: #000000;
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
  }

  .page-title {
    font-size: 28px;
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
  .page-title {
    font-size: 24px;
  }

  .albums-container {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
}
</style>
