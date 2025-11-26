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
