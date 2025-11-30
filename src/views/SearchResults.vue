<template>
  <div class="results-page">
    <div class="content-wrapper">
      <!-- Search Bar -->
      <div class="search-wrapper">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search for Albums, Artists, and Genres"
          class="search-field"
          @keyup.enter="performSearch"
        />
        <svg
          class="search-icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          @click="performSearch"
          style="cursor: pointer;"
        >
          <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M14 14L11.1 11.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading">Loading results...</div>

      <!-- Error State -->
      <div v-if="error" class="error">{{ error }}</div>

      <!-- Releases Section -->
      <div v-if="!loading && releases.length > 0" class="section">
        <h2 class="section-title">Releases</h2>
        <div class="albums-container">
          <div
            v-for="release in releases.slice(0, 10)"
            :key="release.id"
            class="album-card"
          >
            <a :href="release.discogs_url" target="_blank" rel="noopener noreferrer">
              <img
                :src="release.cover_image || release.thumb || '/placeholder-album.png'"
                :alt="release.title"
                class="album-cover"
                @error="handleImageError"
              />
            </a>
            <div class="album-info">
              <div class="album-title">{{ release.title }}</div>
              <div class="album-meta" v-if="release.version_count">
                {{ release.version_count }} versions
              </div>
            </div>
          </div>
        </div>
        <button v-if="releases.length > 10" class="show-all-btn" @click="showAllReleases">
          Show All Releases
        </button>
      </div>

      <!-- Artists Section -->
      <div v-if="!loading && artists.length > 0" class="section">
        <h2 class="section-title">Artists</h2>
        <div class="artists-container">
          <div
            v-for="artist in artists.slice(0, 10)"
            :key="artist.id"
            class="artist-card"
          >
            <a :href="artist.discogs_url" target="_blank" rel="noopener noreferrer">
              <img
                :src="artist.cover_image || artist.thumb || '/placeholder-artist.png'"
                :alt="artist.title"
                class="artist-image"
                @error="handleImageError"
              />
            </a>
            <div class="artist-info">
              <div class="artist-name">{{ artist.title }}</div>
            </div>
          </div>
        </div>
        <button v-if="artists.length > 10" class="show-all-btn" @click="showAllArtists">
          Show All Artists
        </button>
      </div>

      <!-- No Results -->
      <div v-if="!loading && !error && releases.length === 0 && artists.length === 0 && hasSearched" class="no-results">
        No results found for "{{ currentSearchTerm }}"
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchDiscogsUniversal } from '../services/discogs.js'

export default {
  name: 'SearchResults',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const searchQuery = ref('')
    const currentSearchTerm = ref('')
    const releases = ref([])
    const artists = ref([])
    const loading = ref(false)
    const error = ref(null)
    const hasSearched = ref(false)

    const performSearch = async () => {
      if (searchQuery.value.trim()) {
        router.push({
          path: '/results',
          query: { q: searchQuery.value }
        })
      }
    }

    const fetchResults = async (query) => {
      if (!query) return

      loading.value = true
      error.value = null
      hasSearched.value = true
      currentSearchTerm.value = query

      try {
        const data = await searchDiscogsUniversal(query, 50)

        // Separate releases and artists
        releases.value = data.results.filter(item => item.type === 'master')
        artists.value = data.results.filter(item => item.type === 'artist')
      } catch (err) {
        error.value = err.message || 'Failed to fetch search results'
        console.error('Search error:', err)
      } finally {
        loading.value = false
      }
    }

    const handleImageError = (e) => {
      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="240" height="240"%3E%3Crect width="240" height="240" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
    }

    const showAllReleases = () => {
      // Future implementation: show all releases
      console.log('Show all releases clicked')
    }

    const showAllArtists = () => {
      // Future implementation: show all artists
      console.log('Show all artists clicked')
    }

    // Watch for route query changes
    watch(() => route.query.q, (newQuery) => {
      if (newQuery) {
        searchQuery.value = newQuery
        fetchResults(newQuery)
      }
    }, { immediate: true })

    onMounted(() => {
      const query = route.query.q
      if (query) {
        searchQuery.value = query
        fetchResults(query)
      }
    })

    return {
      searchQuery,
      currentSearchTerm,
      releases,
      artists,
      loading,
      error,
      hasSearched,
      performSearch,
      handleImageError,
      showAllReleases,
      showAllArtists
    }
  }
}
</script>

<style scoped>
.results-page {
  min-height: calc(100vh - 70px);
  padding: 40px 20px;
  margin-top: 70px;
}

.content-wrapper {
  max-width: 85%;
  margin: 0 auto;
}

.search-wrapper {
  position: relative;
  background: #ffffff;
  border: 1px solid #919191;
  border-radius: 20px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 14px 16px;
  max-width: 794px;
  margin: 0 auto 40px;
}

.search-field {
  font-family: 'Inria Sans', sans-serif;
  font-size: 12px;
  color: #717171;
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
  width: 16px;
  height: 16px;
  color: #717171;
}

.loading,
.error,
.no-results {
  text-align: center;
  font-family: 'Inria Sans', sans-serif;
  font-size: 1.2rem;
  color: #717171;
  padding: 40px 20px;
}

.error {
  color: #dc3545;
}

.section {
  margin-bottom: 60px;
}

.section-title {
  font-family: 'Inria Sans', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: #000000;
  margin: 0 0 30px 0;
}

/* Releases - Rectangular Cards */
.albums-container {
  display: flex;
  gap: 30px;
  overflow-x: auto;
  padding-bottom: 20px;
  scrollbar-width: thin;
  scrollbar-color: #919191 #f0f0f0;
}

.albums-container::-webkit-scrollbar {
  height: 8px;
}

.albums-container::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.albums-container::-webkit-scrollbar-thumb {
  background: #919191;
  border-radius: 4px;
}

.album-card {
  flex: 0 0 240px;
  display: flex;
  flex-direction: column;
}

.album-cover {
  width: 240px;
  height: 240px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: transform 0.2s;
}

.album-cover:hover {
  transform: scale(1.05);
}

.album-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.album-title {
  font-family: 'Inria Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  line-height: 1.4;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.album-meta {
  font-family: 'Inria Sans', sans-serif;
  font-size: 12px;
  color: #717171;
}

/* Artists - Circular Cards */
.artists-container {
  display: flex;
  gap: 30px;
  overflow-x: auto;
  padding-bottom: 20px;
  scrollbar-width: thin;
  scrollbar-color: #919191 #f0f0f0;
}

.artists-container::-webkit-scrollbar {
  height: 8px;
}

.artists-container::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.artists-container::-webkit-scrollbar-thumb {
  background: #919191;
  border-radius: 4px;
}

.artist-card {
  flex: 0 0 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.artist-image {
  width: 240px;
  height: 240px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 12px;
  transition: transform 0.2s;
}

.artist-image:hover {
  transform: scale(1.05);
}

.artist-info {
  text-align: center;
  width: 100%;
}

.artist-name {
  font-family: 'Inria Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  line-height: 1.4;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.show-all-btn {
  display: block;
  margin: 20px auto 0;
  padding: 12px 32px;
  font-family: 'Inria Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  background: #000000;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.show-all-btn:hover {
  background: #333333;
}

@media (max-width: 768px) {
  .content-wrapper {
    max-width: 95%;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .album-card,
  .artist-card {
    flex: 0 0 180px;
  }

  .album-cover,
  .artist-image {
    width: 180px;
    height: 180px;
  }

  .album-title,
  .artist-name {
    max-width: 180px;
  }
}
</style>
