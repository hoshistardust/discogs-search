/**
 * Discogs API Service
 * Handles authentication and data fetching from Discogs API
 * Documentation: https://www.discogs.com/developers
 */

const DISCOGS_API_BASE = 'https://api.discogs.com'

// Get credentials from environment variables
const CONSUMER_KEY = import.meta.env.VITE_DISCOGS_CONSUMER_KEY
const CONSUMER_SECRET = import.meta.env.VITE_DISCOGS_CONSUMER_SECRET

/**
 * Universal search function for artists and master releases
 * Returns results with links to Discogs and version counts for masters
 * @param {string} query - Search query
 * @param {number} perPage - Number of results per page (default 20)
 * @returns {Promise<Object>} Object with results array and metadata
 */
export async function searchDiscogsUniversal(query, perPage = 20) {
  try {
    // Build the search URL with authentication parameters
    const searchUrl = new URL(`${DISCOGS_API_BASE}/database/search`)

    // Add authentication via key and secret (as per Discogs documentation)
    searchUrl.searchParams.append('key', CONSUMER_KEY)
    searchUrl.searchParams.append('secret', CONSUMER_SECRET)

    // Add search parameters - search both artists and masters
    searchUrl.searchParams.append('q', query)
    searchUrl.searchParams.append('per_page', perPage.toString())

    // Make the API request
    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'DiscogsTopAlbums/1.0'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please check your consumer key and secret.')
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else {
        throw new Error(`API request failed with status ${response.status}`)
      }
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return { results: [], pagination: data.pagination }
    }

    // Process results: filter for artists, masters, and labels, add Discogs URLs
    const processedResults = await Promise.all(
      data.results
        .filter(item => item.type === 'artist' || item.type === 'master' || item.type === 'label' || item.type === 'release')
        .map(async (item) => {
          const result = {
            id: item.id,
            type: item.type,
            title: item.title,
            thumb: item.thumb,
            cover_image: item.cover_image,
            resource_url: item.resource_url,
            uri: item.uri,
            // Construct Discogs detail page URL
            discogs_url: `https://www.discogs.com${item.uri}`,
            // Add filter-related fields from API
            format: item.format || [],
            country: item.country || null,
            year: item.year || null,
            genre: item.genre || [],
            style: item.style || [],
          }

          // If it's a master or release, get the version count
          if ((item.type === 'master' || item.type === 'release') && item.id) {
            try {
              if (item.type === 'master') {
                const versionCount = await getMasterVersionCount(item.id)
                result.version_count = versionCount
              } else {
                // For releases, version count is not applicable
                result.version_count = null
              }
            } catch (err) {
              console.warn(`Failed to get version count for master ${item.id}:`, err)
              result.version_count = null
            }
          }

          // Add artist-specific data
          if (item.type === 'artist') {
            result.aliases = item.alias || []
          }

          return result
        })
    )

    return {
      results: processedResults,
      pagination: data.pagination,
      total: data.pagination?.items || processedResults.length
    }
  } catch (error) {
    console.error('Discogs API Error:', error)
    throw error
  }
}

/**
 * Search for albums/releases in Discogs database
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of album results
 */
export async function searchDiscogs(query) {
  try {
    // Build the search URL with authentication parameters
    const searchUrl = new URL(`${DISCOGS_API_BASE}/database/search`)

    // Add authentication via key and secret (as per Discogs documentation)
    searchUrl.searchParams.append('key', CONSUMER_KEY)
    searchUrl.searchParams.append('secret', CONSUMER_SECRET)

    // Add search parameters
    searchUrl.searchParams.append('q', query)
    searchUrl.searchParams.append('type', 'release') // Search for releases/albums
    searchUrl.searchParams.append('per_page', '10') // Get 10 results to have options

    // Make the API request
    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'DiscogsTopAlbums/1.0'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please check your consumer key and secret.')
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else {
        throw new Error(`API request failed with status ${response.status}`)
      }
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return []
    }

    return data.results
  } catch (error) {
    console.error('Discogs API Error:', error)
    throw error
  }
}

/**
 * Get the total number of versions (releases) for a master release
 * @param {number} masterId - The Discogs master release ID
 * @returns {Promise<number>} Total number of versions
 */
export async function getMasterVersionCount(masterId) {
  try {
    const url = new URL(`${DISCOGS_API_BASE}/masters/${masterId}/versions`)
    url.searchParams.append('key', CONSUMER_KEY)
    url.searchParams.append('secret', CONSUMER_SECRET)
    url.searchParams.append('per_page', '1') // We only need pagination data, not actual results

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'DiscogsTopAlbums/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch master versions: ${response.status}`)
    }

    const data = await response.json()

    // Return the total items from pagination
    return data.pagination?.items || 0
  } catch (error) {
    console.error('Error fetching master version count:', error)
    return null
  }
}

/**
 * Get detailed information about a specific release
 * @param {number} releaseId - The Discogs release ID
 * @returns {Promise<Object>} Detailed release information
 */
export async function getReleaseDetails(releaseId) {
  try {
    const url = new URL(`${DISCOGS_API_BASE}/releases/${releaseId}`)
    url.searchParams.append('key', CONSUMER_KEY)
    url.searchParams.append('secret', CONSUMER_SECRET)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'DiscogsTopAlbums/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch release details: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching release details:', error)
    throw error
  }
}

/**
 * Get top albums from 2025 by community engagement
 * @returns {Promise<Array>} Array of top 5 albums sorted by engagement
 */
export async function getTop2025Albums() {
  try {
    const searchUrl = new URL(`${DISCOGS_API_BASE}/database/search`)
    searchUrl.searchParams.append('key', CONSUMER_KEY)
    searchUrl.searchParams.append('secret', CONSUMER_SECRET)
    searchUrl.searchParams.append('year', '2025')
    searchUrl.searchParams.append('type', 'release')
    searchUrl.searchParams.append('per_page', '50') // Get more results to filter by engagement

    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'DiscogsTopAlbums/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch 2025 albums: ${response.status}`)
    }

    const data = await response.json()

    // Filter results that have community data and sort by engagement
    const albumsWithEngagement = data.results
      .filter(album => album.community && (album.community.have > 0 || album.community.want > 0))
      .map(album => ({
        id: album.id,
        title: album.title,
        artist: album.title.split(' - ')[0] || 'Unknown Artist',
        year: album.year,
        format: album.format?.join(', ') || 'Unknown Format',
        label: album.label?.[0] || 'Unknown Label',
        cover_image: album.cover_image || album.thumb || '',
        engagement: (album.community?.have || 0) + (album.community?.want || 0),
        have: album.community?.have || 0,
        want: album.community?.want || 0
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10)

    return albumsWithEngagement
  } catch (error) {
    console.error('Error fetching top 2025 albums:', error)
    throw error
  }
}

/**
 * Get top artists from 2025 by aggregating from top albums
 * This approach gets top 100 albums from 2025 and aggregates artist popularity
 * Total API requests: 1 (initial search)
 * @returns {Promise<Array>} Array of top 10 artists sorted by album engagement
 */
export async function getTop2025Artists() {
  try {
    const searchUrl = new URL(`${DISCOGS_API_BASE}/database/search`)
    searchUrl.searchParams.append('key', CONSUMER_KEY)
    searchUrl.searchParams.append('secret', CONSUMER_SECRET)
    searchUrl.searchParams.append('year', '2025')
    searchUrl.searchParams.append('type', 'release')
    searchUrl.searchParams.append('per_page', '100') // Get top 100 albums

    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'DiscogsTopAlbums/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch 2025 albums for artist aggregation: ${response.status}`)
    }

    const data = await response.json()

    // Aggregate artist data from albums
    const artistMap = new Map()

    // First, collect all unique artist names and their best album image
    data.results.forEach(album => {
      if (!album.community || (album.community.have === 0 && album.community.want === 0)) {
        return // Skip albums with no engagement
      }

      // Extract artist name (format is usually "Artist - Album Title")
      const artistName = album.title.split(' - ')[0]?.trim()
      if (!artistName) return

      const engagement = (album.community?.have || 0) + (album.community?.want || 0)

      if (!artistMap.has(artistName)) {
        artistMap.set(artistName, {
          name: artistName,
          image: album.cover_image || album.thumb || '',
          totalEngagement: 0,
          albumCount: 0,
          topAlbumEngagement: 0,
          searchQuery: artistName // Store for searching
        })
      }

      const artist = artistMap.get(artistName)
      artist.totalEngagement += engagement
      artist.albumCount++
      artist.topAlbumEngagement = Math.max(artist.topAlbumEngagement, engagement)

      // Update image if this album has higher engagement
      if (engagement > artist.topAlbumEngagement) {
        artist.image = album.cover_image || album.thumb || artist.image
      }
    })

    // Convert to array and sort by total engagement
    const topArtists = Array.from(artistMap.values())
      .filter(artist => artist.totalEngagement > 0)
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, 10)

    return topArtists
  } catch (error) {
    console.error('Error fetching top 2025 artists:', error)
    throw error
  }
}

/**
 * Get list of available genres from Discogs
 * Note: Discogs doesn't have a dedicated genres endpoint, so we'll use a curated list
 * based on Discogs' genre taxonomy
 * @returns {Array} Array of genre strings
 */
export function getGenres() {
  return [
    'Rock',
    'Electronic',
    'Pop',
    'Jazz',
    'Classical',
    'Hip Hop',
    'Reggae',
    'Latin',
    'Blues',
    'Folk, World, & Country',
    'Funk / Soul',
    'Stage & Screen',
    'Brass & Military',
    'Children\'s',
    'Non-Music'
  ].sort()
}

/**
 * Get list of available styles from Discogs
 * Note: This is a curated subset of popular styles
 * @returns {Array} Array of style strings
 */
export function getStyles() {
  return [
    'Alternative Rock',
    'Ambient',
    'Blues Rock',
    'Breakbeat',
    'Classical',
    'Country',
    'Deep House',
    'Disco',
    'Downtempo',
    'Drum n Bass',
    'Dub',
    'Dubstep',
    'Electro',
    'Experimental',
    'Folk',
    'Funk',
    'Garage Rock',
    'Grime',
    'Grunge',
    'Hardcore',
    'Hard Rock',
    'House',
    'Indie Rock',
    'Industrial',
    'Jazz-Funk',
    'Leftfield',
    'Lo-Fi',
    'Metal',
    'Minimal',
    'New Wave',
    'Post-Punk',
    'Progressive Rock',
    'Psychedelic Rock',
    'Punk',
    'R&B',
    'Reggae',
    'Soul',
    'Synth-pop',
    'Tech House',
    'Techno',
    'Trance',
    'Trip Hop'
  ].sort()
}

/**
 * Search for releases by genre and/or style
 * @param {Array<string>} genres - Array of genre names
 * @param {Array<string>} styles - Array of style names
 * @param {number} perPage - Number of results per page (default 50)
 * @returns {Promise<Object>} Object with results array and metadata
 */
export async function searchByGenreStyle(genres = [], styles = [], perPage = 50) {
  try {
    const searchUrl = new URL(`${DISCOGS_API_BASE}/database/search`)
    searchUrl.searchParams.append('key', CONSUMER_KEY)
    searchUrl.searchParams.append('secret', CONSUMER_SECRET)
    searchUrl.searchParams.append('type', 'release')
    searchUrl.searchParams.append('per_page', perPage.toString())

    // Add genre filter
    if (genres.length > 0) {
      searchUrl.searchParams.append('genre', genres.join(','))
    }

    // Add style filter
    if (styles.length > 0) {
      searchUrl.searchParams.append('style', styles.join(','))
    }

    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'DiscogsTopAlbums/1.0'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please check your consumer key and secret.')
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else {
        throw new Error(`API request failed with status ${response.status}`)
      }
    }

    const data = await response.json()

    return {
      results: data.results || [],
      pagination: data.pagination,
      total: data.pagination?.items || 0
    }
  } catch (error) {
    console.error('Discogs genre/style search error:', error)
    throw error
  }
}
