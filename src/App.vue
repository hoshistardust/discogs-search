<template>
  <div class="container">
    <header>
      <h1>🎵 Top 5 Albums from Discogs</h1>
      <p class="subtitle">Discover the most popular albums</p>
    </header>

    <div class="search-section">
      <input
        v-model="searchQuery"
        @input="searchAlbums"
        type="text"
        placeholder="Search for albums or artists..."
        class="search-input"
      />
    </div>

    <div class="loading" v-if="loading">
      <div class="spinner"></div>
      <p>Loading albums...</p>
    </div>

    <div class="error" v-if="error">
      <p>{{ error }}</p>
      <button @click="retryFetch" class="btn-secondary">Retry</button>
    </div>

    <div class="albums-grid" v-if="!loading && albums.length > 0">
      <div v-for="(album, index) in albums" :key="album.id" class="album-card">
        <div class="rank-badge">{{ index + 1 }}</div>
        <div class="album-image">
          <img :src="album.cover_image || album.thumb || 'https://via.placeholder.com/300x300?text=No+Image'"
               :alt="album.title"
               @error="handleImageError($event)" />
        </div>
        <div class="album-info">
          <h3 class="album-title">{{ album.title }}</h3>
          <p class="album-artist" v-if="album.artist">{{ album.artist }}</p>
          <div class="album-details">
            <span v-if="album.year" class="detail-item">📅 {{ album.year }}</span>
            <span v-if="album.format && album.format.length" class="detail-item">
              💿 {{ album.format.join(', ') }}
            </span>
            <span v-if="album.label && album.label.length" class="detail-item">
              🏷️ {{ album.label.join(', ') }}
            </span>
          </div>
          <div class="album-stats" v-if="album.community">
            <span v-if="album.community.have">
              ❤️ {{ album.community.have }} have
            </span>
            <span v-if="album.community.want">
              ⭐ {{ album.community.want }} want
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="empty-state" v-if="!loading && albums.length === 0 && !error">
      <p>No albums found. Try searching for something else!</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { searchDiscogs } from './services/discogs'

export default {
  name: 'App',
  setup() {
    const albums = ref([])
    const loading = ref(false)
    const error = ref(null)
    const searchQuery = ref('')
    let searchTimeout = null

    const fetchAlbums = async (query = 'beatles') => {
      loading.value = true
      error.value = null

      try {
        const results = await searchDiscogs(query)

        // Take top 5 results
        albums.value = results.slice(0, 5).map(result => ({
          id: result.id,
          title: result.title,
          artist: result.title.split(' - ')[0], // Extract artist from title
          cover_image: result.cover_image,
          thumb: result.thumb,
          year: result.year,
          format: result.format,
          label: result.label,
          country: result.country,
          community: result.community,
          uri: result.uri
        }))
      } catch (err) {
        console.error('Error fetching albums:', err)
        error.value = err.message || 'Failed to fetch albums. Please check your API credentials in the .env file.'
      } finally {
        loading.value = false
      }
    }

    const searchAlbums = () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }

      if (!searchQuery.value.trim()) {
        fetchAlbums('beatles')
        return
      }

      searchTimeout = setTimeout(() => {
        fetchAlbums(searchQuery.value)
      }, 500)
    }

    const retryFetch = () => {
      fetchAlbums(searchQuery.value || 'beatles')
    }

    const handleImageError = (event) => {
      event.target.src = 'https://via.placeholder.com/300x300?text=No+Image'
    }

    onMounted(() => {
      fetchAlbums()
    })

    return {
      albums,
      loading,
      error,
      searchQuery,
      searchAlbums,
      retryFetch,
      handleImageError
    }
  }
}
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
  padding: 40px 20px;
}

h1 {
  font-size: 3rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

.search-section {
  margin-bottom: 30px;
}

.search-input {
  width: 100%;
  padding: 16px 24px;
  font-size: 1.1rem;
  border: none;
  border-radius: 50px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: box-shadow 0.3s;
}

.search-input:focus {
  outline: none;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  background: #ff6b6b;
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 20px;
}

.error p {
  margin-bottom: 10px;
}

.btn-secondary {
  padding: 10px 20px;
  background: white;
  color: #ff6b6b;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  transition: transform 0.2s;
}

.btn-secondary:hover {
  transform: scale(1.05);
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.album-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
}

.album-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.rank-badge {
  position: absolute;
  top: 20px;
  left: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  z-index: 10;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.album-image {
  width: 100%;
  height: 300px;
  overflow: hidden;
  background: #f0f0f0;
}

.album-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-info {
  padding: 20px;
}

.album-title {
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
}

.album-artist {
  color: #667eea;
  font-size: 1.1rem;
  margin-bottom: 15px;
  font-weight: 600;
}

.album-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.detail-item {
  color: #666;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

.album-stats {
  display: flex;
  gap: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
  font-size: 0.9rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: white;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  h1 {
    font-size: 2rem;
  }

  .albums-grid {
    grid-template-columns: 1fr;
  }
}
</style>
