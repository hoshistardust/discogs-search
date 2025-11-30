<template>
  <div class="results-page">
    <FilterSidebar
      :is-open="showFilters"
      @filter-change="handleFilterChange"
    />

    <div class="content-wrapper" :class="{ 'with-sidebar': showFilters }">
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

      <!-- Tabs -->
      <div class="tabs-container">
        <div class="tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'all' }"
            @click="setTab('all')"
          >
            All
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'releases' }"
            @click="setTab('releases')"
          >
            Releases
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'artists' }"
            @click="setTab('artists')"
          >
            Artists
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'labels' }"
            @click="setTab('labels')"
          >
            Labels
          </button>
        </div>

        <!-- Sort by dropdown - only show in filtered views -->
        <div v-if="activeTab !== 'all'" class="sort-wrapper">
          <label class="sort-label">Sort by</label>
          <select v-model="sortBy" class="sort-select">
            <option value="relevance">Relevance</option>
            <option value="year-desc">Year (Newest)</option>
            <option value="year-asc">Year (Oldest)</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading">Loading results...</div>

      <!-- Error State -->
      <div v-if="error" class="error">{{ error }}</div>

      <!-- All View (Default) -->
      <div v-if="!loading && activeTab === 'all'">
        <!-- Releases Section -->
        <div v-if="releases.length > 0" class="section">
          <div class="section-header">
            <h2 class="section-title">Releases</h2>
            <button class="view-all-link" @click="setTab('releases')">
              View all
            </button>
          </div>
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
                  {{ release.version_count }} version{{ release.version_count !== 1 ? 's' : '' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Artists Section -->
        <div v-if="artists.length > 0" class="section">
          <div class="section-header">
            <h2 class="section-title">Artists</h2>
            <button class="view-all-link" @click="setTab('artists')">
              View all
            </button>
          </div>
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
        </div>

        <!-- Labels Section -->
        <div v-if="labels.length > 0" class="section">
          <div class="section-header">
            <h2 class="section-title">Labels</h2>
            <button class="view-all-link" @click="setTab('labels')">
              View all
            </button>
          </div>
          <div class="labels-container">
            <div
              v-for="label in labels.slice(0, 10)"
              :key="label.id"
              class="label-card"
            >
              <a :href="label.discogs_url" target="_blank" rel="noopener noreferrer">
                <img
                  :src="label.cover_image || label.thumb || '/placeholder-label.png'"
                  :alt="label.title"
                  class="label-image"
                  @error="handleImageError"
                />
              </a>
              <div class="label-info">
                <div class="label-name">{{ label.title }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div v-if="releases.length === 0 && artists.length === 0 && labels.length === 0 && hasSearched" class="no-results">
          No results found for "{{ currentSearchTerm }}"
        </div>
      </div>

      <!-- Filtered Views (Releases/Artists/Labels) -->
      <div v-if="!loading && activeTab !== 'all'">
        <!-- Releases Grid -->
        <div v-if="activeTab === 'releases'" class="grid-section">
          <div v-if="paginatedReleases.length > 0" class="results-grid">
            <div
              v-for="release in paginatedReleases"
              :key="release.id"
              class="grid-album-card"
            >
              <a :href="release.discogs_url" target="_blank" rel="noopener noreferrer">
                <div class="grid-album-cover-wrapper">
                  <img
                    :src="release.cover_image || release.thumb || '/placeholder-album.png'"
                    :alt="release.title"
                    class="grid-album-cover"
                    @error="handleImageError"
                  />
                </div>
              </a>
              <div class="grid-album-info">
                <div class="grid-album-title">{{ release.title }}</div>
                <div class="grid-album-meta">
                  <span v-if="release.year">{{ release.year }}</span>
                  <span v-if="release.format && release.format.length">{{ release.format[0] }}</span>
                </div>
                <div class="grid-album-versions" v-if="release.version_count">
                  {{ release.version_count }} version{{ release.version_count !== 1 ? 's' : '' }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-results">
            No releases found
          </div>

          <!-- Pagination for Releases -->
          <div v-if="totalReleasesPages > 1" class="pagination">
            <button
              class="pagination-btn"
              :disabled="currentReleasesPage === 1"
              @click="currentReleasesPage--"
            >
              Previous
            </button>
            <span class="pagination-info">
              Page {{ currentReleasesPage }} of {{ totalReleasesPages }}
            </span>
            <button
              class="pagination-btn"
              :disabled="currentReleasesPage === totalReleasesPages"
              @click="currentReleasesPage++"
            >
              Next
            </button>
          </div>
        </div>

        <!-- Artists Grid -->
        <div v-if="activeTab === 'artists'" class="grid-section">
          <div v-if="paginatedArtists.length > 0" class="results-grid">
            <div
              v-for="artist in paginatedArtists"
              :key="artist.id"
              class="grid-artist-card"
            >
              <a :href="artist.discogs_url" target="_blank" rel="noopener noreferrer">
                <div class="grid-artist-image-wrapper">
                  <img
                    :src="artist.cover_image || artist.thumb || '/placeholder-artist.png'"
                    :alt="artist.title"
                    class="grid-artist-image"
                    @error="handleImageError"
                  />
                </div>
              </a>
              <div class="grid-artist-info">
                <div class="grid-artist-name">{{ artist.title }}</div>
              </div>
            </div>
          </div>
          <div v-else class="no-results">
            No artists found
          </div>

          <!-- Pagination for Artists -->
          <div v-if="totalArtistsPages > 1" class="pagination">
            <button
              class="pagination-btn"
              :disabled="currentArtistsPage === 1"
              @click="currentArtistsPage--"
            >
              Previous
            </button>
            <span class="pagination-info">
              Page {{ currentArtistsPage }} of {{ totalArtistsPages }}
            </span>
            <button
              class="pagination-btn"
              :disabled="currentArtistsPage === totalArtistsPages"
              @click="currentArtistsPage++"
            >
              Next
            </button>
          </div>
        </div>

        <!-- Labels Grid -->
        <div v-if="activeTab === 'labels'" class="grid-section">
          <div v-if="paginatedLabels.length > 0" class="results-grid">
            <div
              v-for="label in paginatedLabels"
              :key="label.id"
              class="grid-label-card"
            >
              <a :href="label.discogs_url" target="_blank" rel="noopener noreferrer">
                <div class="grid-label-image-wrapper">
                  <img
                    :src="label.cover_image || label.thumb || '/placeholder-label.png'"
                    :alt="label.title"
                    class="grid-label-image"
                    @error="handleImageError"
                  />
                </div>
              </a>
              <div class="grid-label-info">
                <div class="grid-label-name">{{ label.title }}</div>
              </div>
            </div>
          </div>
          <div v-else class="no-results">
            No labels found
          </div>

          <!-- Pagination for Labels -->
          <div v-if="totalLabelsPages > 1" class="pagination">
            <button
              class="pagination-btn"
              :disabled="currentLabelsPage === 1"
              @click="currentLabelsPage--"
            >
              Previous
            </button>
            <span class="pagination-info">
              Page {{ currentLabelsPage }} of {{ totalLabelsPages }}
            </span>
            <button
              class="pagination-btn"
              :disabled="currentLabelsPage === totalLabelsPages"
              @click="currentLabelsPage++"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchDiscogsUniversal } from '../services/discogs.js'
import FilterSidebar from '../components/FilterSidebar.vue'

export default {
  name: 'SearchResults',
  components: {
    FilterSidebar,
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const searchQuery = ref('')
    const currentSearchTerm = ref('')
    const releases = ref([])
    const artists = ref([])
    const labels = ref([])
    const loading = ref(false)
    const error = ref(null)
    const hasSearched = ref(false)
    const activeTab = ref('all')
    const sortBy = ref('relevance')

    // Pagination
    const itemsPerPage = 24
    const currentReleasesPage = ref(1)
    const currentArtistsPage = ref(1)
    const currentLabelsPage = ref(1)

    // Filter state
    const showFilters = computed(() => activeTab.value !== 'all')
    const activeFilters = ref({
      formats: [],
      countries: [],
      decades: [],
    })

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
        const data = await searchDiscogsUniversal(query, 100)

        // Separate results by type
        releases.value = data.results.filter(item => item.type === 'master' || item.type === 'release')
        artists.value = data.results.filter(item => item.type === 'artist')
        labels.value = data.results.filter(item => item.type === 'label')
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

    const setTab = (tab) => {
      activeTab.value = tab
      // Reset pagination when changing tabs
      currentReleasesPage.value = 1
      currentArtistsPage.value = 1
      currentLabelsPage.value = 1
    }

    const handleFilterChange = (filters) => {
      activeFilters.value = filters
      // Reset pagination when filters change
      currentReleasesPage.value = 1
      currentArtistsPage.value = 1
      currentLabelsPage.value = 1
    }

    // Filtered results based on active filters
    const filteredReleases = computed(() => {
      let results = [...releases.value]

      // Apply format filter
      if (activeFilters.value.formats.length > 0) {
        results = results.filter(release => {
          if (!release.format || release.format.length === 0) return false
          return activeFilters.value.formats.some(filter =>
            release.format.some(f => f.toLowerCase().includes(filter.toLowerCase()))
          )
        })
      }

      // Apply country filter
      if (activeFilters.value.countries.length > 0) {
        results = results.filter(release => {
          if (!release.country) return false
          return activeFilters.value.countries.includes(release.country)
        })
      }

      // Apply decade filter
      if (activeFilters.value.decades.length > 0) {
        results = results.filter(release => {
          if (!release.year) return false
          const yearNum = parseInt(release.year)
          return activeFilters.value.decades.some(decade => {
            const decadeNum = parseInt(decade)
            return yearNum >= decadeNum && yearNum < decadeNum + 10
          })
        })
      }

      // Apply sorting
      if (sortBy.value === 'year-desc') {
        results.sort((a, b) => (b.year || 0) - (a.year || 0))
      } else if (sortBy.value === 'year-asc') {
        results.sort((a, b) => (a.year || 0) - (b.year || 0))
      } else if (sortBy.value === 'title') {
        results.sort((a, b) => a.title.localeCompare(b.title))
      }

      return results
    })

    const filteredArtists = computed(() => {
      let results = [...artists.value]

      if (sortBy.value === 'title') {
        results.sort((a, b) => a.title.localeCompare(b.title))
      }

      return results
    })

    const filteredLabels = computed(() => {
      let results = [...labels.value]

      if (sortBy.value === 'title') {
        results.sort((a, b) => a.title.localeCompare(b.title))
      }

      return results
    })

    // Paginated results
    const paginatedReleases = computed(() => {
      const start = (currentReleasesPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredReleases.value.slice(start, end)
    })

    const paginatedArtists = computed(() => {
      const start = (currentArtistsPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredArtists.value.slice(start, end)
    })

    const paginatedLabels = computed(() => {
      const start = (currentLabelsPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredLabels.value.slice(start, end)
    })

    // Total pages
    const totalReleasesPages = computed(() => Math.ceil(filteredReleases.value.length / itemsPerPage))
    const totalArtistsPages = computed(() => Math.ceil(filteredArtists.value.length / itemsPerPage))
    const totalLabelsPages = computed(() => Math.ceil(filteredLabels.value.length / itemsPerPage))

    // Watch for route query changes
    watch(() => route.query.q, (newQuery) => {
      if (newQuery) {
        searchQuery.value = newQuery
        fetchResults(newQuery)
        activeTab.value = 'all' // Reset to All view on new search
      }
    }, { immediate: true })

    return {
      searchQuery,
      currentSearchTerm,
      releases,
      artists,
      labels,
      loading,
      error,
      hasSearched,
      activeTab,
      sortBy,
      showFilters,
      paginatedReleases,
      paginatedArtists,
      paginatedLabels,
      currentReleasesPage,
      currentArtistsPage,
      currentLabelsPage,
      totalReleasesPages,
      totalArtistsPages,
      totalLabelsPages,
      performSearch,
      handleImageError,
      setTab,
      handleFilterChange,
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
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.content-wrapper.with-sidebar {
  margin-left: calc(280px + 2%);
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

/* Tabs */
.tabs-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;
}

.tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  font-family: 'Inria Sans', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #717171;
  background: transparent;
  border: none;
  padding: 12px 24px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-btn:hover {
  background: #f0f0f0;
  color: #000000;
}

.tab-btn.active {
  background: #000000;
  color: #ffffff;
}

/* Sort dropdown */
.sort-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sort-label {
  font-family: 'Inria Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
}

.sort-select {
  font-family: 'Inria Sans', sans-serif;
  font-size: 14px;
  color: #000000;
  background: #ffffff;
  border: 1px solid #919191;
  border-radius: 12px;
  padding: 8px 16px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

.sort-select:hover {
  border-color: #000000;
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

/* Section styles */
.section {
  margin-bottom: 60px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}

.section-title {
  font-family: 'Inria Sans', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: #000000;
  margin: 0;
}

.view-all-link {
  font-family: 'Inria Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #717171;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s;
}

.view-all-link:hover {
  color: #000000;
}

/* Horizontal scroll containers */
.albums-container,
.artists-container,
.labels-container {
  display: flex;
  gap: 30px;
  overflow-x: auto;
  padding-bottom: 20px;
  scrollbar-width: thin;
  scrollbar-color: #919191 #f0f0f0;
}

.albums-container::-webkit-scrollbar,
.artists-container::-webkit-scrollbar,
.labels-container::-webkit-scrollbar {
  height: 8px;
}

.albums-container::-webkit-scrollbar-track,
.artists-container::-webkit-scrollbar-track,
.labels-container::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.albums-container::-webkit-scrollbar-thumb,
.artists-container::-webkit-scrollbar-thumb,
.labels-container::-webkit-scrollbar-thumb {
  background: #919191;
  border-radius: 4px;
}

/* Releases - Rectangular Cards */
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

/* Labels - Similar to Releases */
.label-card {
  flex: 0 0 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.label-image {
  width: 240px;
  height: 240px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: transform 0.2s;
}

.label-image:hover {
  transform: scale(1.05);
}

.label-info {
  text-align: center;
  width: 100%;
}

.label-name {
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

/* Grid Layout for Filtered Views - 4 columns */
.grid-section {
  margin-bottom: 40px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
}

.grid-album-card,
.grid-artist-card,
.grid-label-card {
  display: flex;
  flex-direction: column;
}

.grid-album-cover-wrapper,
.grid-artist-image-wrapper,
.grid-label-image-wrapper {
  width: 100%;
  aspect-ratio: 1;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
}

.grid-album-cover,
.grid-label-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.grid-artist-image-wrapper {
  border-radius: 50%;
}

.grid-artist-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  transition: transform 0.2s;
}

.grid-album-cover:hover,
.grid-artist-image:hover,
.grid-label-image:hover {
  transform: scale(1.05);
}

.grid-album-info,
.grid-artist-info,
.grid-label-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.grid-artist-info {
  text-align: center;
}

.grid-album-title,
.grid-artist-name,
.grid-label-name {
  font-family: 'Inria Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.grid-album-meta {
  font-family: 'Inria Sans', sans-serif;
  font-size: 12px;
  color: #717171;
  display: flex;
  gap: 8px;
}

.grid-album-versions {
  font-family: 'Inria Sans', sans-serif;
  font-size: 12px;
  color: #717171;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
}

.pagination-btn {
  font-family: 'Inria Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  background: #000000;
  border: none;
  border-radius: 20px;
  padding: 10px 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #333333;
}

.pagination-btn:disabled {
  background: #d0d0d0;
  cursor: not-allowed;
}

.pagination-info {
  font-family: 'Inria Sans', sans-serif;
  font-size: 14px;
  color: #000000;
}

@media (max-width: 1400px) {
  .results-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .content-wrapper.with-sidebar {
    margin-left: calc(240px + 2%);
  }

  .results-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    max-width: 95%;
  }

  .content-wrapper.with-sidebar {
    margin-left: 0;
    padding-left: 260px;
  }

  .tabs-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .album-card,
  .artist-card,
  .label-card {
    flex: 0 0 180px;
  }

  .album-cover,
  .artist-image,
  .label-image {
    width: 180px;
    height: 180px;
  }

  .album-title,
  .artist-name,
  .label-name {
    max-width: 180px;
  }

  .results-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .tabs {
    flex-wrap: wrap;
  }

  .tab-btn {
    font-size: 14px;
    padding: 10px 20px;
  }

  .results-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
