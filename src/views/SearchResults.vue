<template>
  <div class="results-page">
    <!-- Header Hamburger Button -->
    <button
      v-if="showFilters && isMobileView"
      class="header-hamburger-btn"
      @click="toggleMobileSidebar"
      :aria-label="mobileSidebarOpen ? 'Close filters' : 'Open filters'"
    >
      <span class="material-symbols-outlined">menu</span>
    </button>

    <!-- Mobile Overlay - Only show when sidebar is open -->
    <div
      v-if="showFilters && isMobileView && mobileSidebarOpen"
      class="sidebar-overlay"
      @click="closeSidebar"
    ></div>

    <FilterSidebar
      :is-open="showFilters && (isMobileView ? mobileSidebarOpen : true)"
      :available-formats="availableFormats"
      :available-countries="availableCountries"
      :available-genres="availableGenres"
      :available-styles="availableStyles"
      :available-decades="availableDecades"
      @filter-change="handleFilterChange"
    />

    <div
      class="content-wrapper"
      :class="{ 'with-sidebar': showFilters && !isMobileView }"
    >
      <!-- Search Bar -->
      <div class="search-with-button">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search for Releases, Artists, and Labels"
          class="search-field-solo"
          @keyup.enter="performSearch"
        />
        <button class="search-button" @click="performSearch">
          <span class="material-symbols-outlined">search</span>
        </button>
      </div>

      <!-- Tabs -->
      <div class="tabs-container-wrapper">
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
          <div v-if="activeTab === 'releases'" class="sort-wrapper">
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
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading">Loading results...</div>

      <!-- Error State -->
      <div v-if="error" class="error">{{ error }}</div>

      <!-- All View (Default) -->
      <div v-if="!loading && activeTab === 'all'">
        <!-- Releases Section -->
        <div v-if="releases.length > 0" class="section">
          <div class="section-header-no-border">
            <h2 class="section-title">Releases</h2>
            <button class="view-all-link" @click="setTab('releases')">
              View all
            </button>
          </div>
          <div class="albums-section-wrapper">
            <div class="albums-container">
              <div
                v-for="release in releases.slice(0, 10)"
                :key="release.id"
                class="album-card"
                :class="{ 'is-expanded': expandedReleaseId === release.id }"
              >
                <a
                  :href="release.discogs_url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div class="album-cover-wrapper">
                    <img
                      v-if="getImageUrl(release)"
                      :src="getImageUrl(release)"
                      :alt="release.title"
                      class="album-cover"
                      @error="handleImageError"
                    />
                    <div v-else class="image-placeholder">
                      <span class="material-symbols-outlined">album</span>
                    </div>
                  </div>
                </a>
                <div class="album-info">
                  <div class="album-title">{{ release.title }}</div>
                  <div
                    class="album-versions-link"
                    v-if="release.type === 'master'"
                    @click="toggleVersions(release)"
                  >
                    View versions
                    <span class="plus-icon">{{
                      expandedReleaseId === release.id ? "−" : "+"
                    }}</span>
                  </div>
                </div>
                <!-- Indicator arrow pointing down when expanded -->
                <div
                  v-if="expandedReleaseId === release.id"
                  class="expansion-indicator"
                ></div>
              </div>
            </div>
            <!-- Expandable Versions Panel - Full Width Below Container -->
            <div
              v-if="expandedReleaseId && releases.slice(0, 10).some(r => r.id === expandedReleaseId)"
              class="versions-panel-row all-view-panel"
              :class="{
                open: expandedReleaseId,
                loading: loadingVersions
              }"
            >
              <div
                v-if="expandedVersions.length > 0 && !loadingVersions"
                class="versions-list"
              >
                <a
                  v-for="(version, vIndex) in expandedVersions"
                  :key="version.id"
                  :href="version.discogs_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="version-item"
                  :style="{ animationDelay: `${vIndex * 0.05}s` }"
                >
                  <div class="version-thumb-wrapper">
                    <img
                      :src="
                        version.thumb ||
                        '/placeholder-album.png'
                      "
                      :alt="version.title"
                      class="version-thumb"
                      @load="handleVersionImageLoad"
                      @error="handleImageError"
                    />
                  </div>
                  <div class="version-info">
                    <div class="version-format">{{ version.format }}</div>
                    <div class="version-year">{{ version.year }}</div>
                    <div class="version-country" v-if="version.country">
                      {{ version.country }}
                    </div>
                  </div>
                </a>
                <a
                  :href="`https://www.discogs.com/master/${expandedReleaseId}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="all-versions-link"
                  :style="{ animationDelay: `${expandedVersions.length * 0.05}s` }"
                >
                  All versions
                </a>
              </div>
              <div
                v-else-if="expandedVersions.length === 0 && !loadingVersions"
                class="versions-empty"
              >
                No versions found
              </div>
            </div>
          </div>
        </div>

        <!-- Artists Section -->
        <div v-if="artists.length > 0" class="section">
          <div class="section-header-no-border">
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
              :class="{ 'is-expanded': expandedArtistId === artist.id }"
            >
              <a
                :href="artist.discogs_url"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  v-if="getImageUrl(artist)"
                  :src="getImageUrl(artist)"
                  :alt="artist.title"
                  class="artist-image"
                  @error="handleImageError"
                />
                <div v-else class="artist-image image-placeholder">
                  <span class="material-symbols-outlined">person</span>
                </div>
              </a>
              <div class="artist-info">
                <div class="artist-name">{{ artist.title }}</div>
                <div
                  class="artist-releases-link"
                  @click="toggleArtistAlbums(artist)"
                >
                  View releases
                  <span class="plus-icon">{{
                    expandedArtistId === artist.id ? "−" : "+"
                  }}</span>
                </div>
              </div>
              <!-- Indicator arrow pointing down when expanded -->
              <div
                v-if="expandedArtistId === artist.id"
                class="expansion-indicator"
              ></div>
            </div>
          </div>
          <!-- Expandable Releases Panel for Artists - Full width below horizontal scroll -->
          <div
            v-if="expandedArtistId && artists.slice(0, 10).some(a => a.id === expandedArtistId)"
            class="versions-panel-row all-view-panel"
            :class="{
              open: expandedArtistId,
              loading: loadingAlbums
            }"
          >
            <div
              v-if="expandedAlbums.length > 0 && !loadingAlbums"
              class="versions-list"
            >
              <a
                v-for="(album, aIndex) in expandedAlbums"
                :key="album.id"
                :href="album.discogs_url"
                target="_blank"
                rel="noopener noreferrer"
                class="version-item"
                :style="{ animationDelay: `${aIndex * 0.05}s` }"
              >
                <div class="version-thumb-wrapper">
                  <img
                    :src="
                      getImageUrl(album) ||
                      '/placeholder-album.png'
                    "
                    :alt="album.title"
                    class="version-thumb"
                    @load="handleVersionImageLoad"
                    @error="handleImageError"
                  />
                </div>
                <div class="version-info">
                  <div class="version-format">{{ album.title }}</div>
                  <div class="version-year" v-if="album.year">{{ album.year }}</div>
                </div>
              </a>
              <a
                v-if="totalAlbumsCount > 10"
                :href="artists.slice(0, 10).find(a => a.id === expandedArtistId)?.discogs_url"
                target="_blank"
                rel="noopener noreferrer"
                class="all-versions-link"
                :style="{ animationDelay: `${expandedAlbums.length * 0.05}s` }"
              >
                All releases
              </a>
            </div>
            <div
              v-else-if="expandedAlbums.length === 0 && !loadingAlbums"
              class="versions-empty"
            >
              No releases found
            </div>
          </div>
        </div>

        <!-- Labels Section -->
        <div v-if="labels.length > 0" class="section">
          <div class="section-header-no-border">
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
              :class="{ 'is-expanded': expandedLabelId === label.id }"
            >
              <a
                :href="label.discogs_url"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  v-if="getImageUrl(label)"
                  :src="getImageUrl(label)"
                  :alt="label.title"
                  class="label-image"
                  @error="handleImageError"
                />
                <div v-else class="label-image image-placeholder">
                  <span class="material-symbols-outlined">label</span>
                </div>
              </a>
              <div class="label-info">
                <div class="label-name">{{ label.title }}</div>
                <div
                  class="label-releases-link"
                  @click="toggleLabelAlbums(label)"
                >
                  View releases
                  <span class="plus-icon">{{
                    expandedLabelId === label.id ? "−" : "+"
                  }}</span>
                </div>
              </div>
              <!-- Indicator arrow pointing down when expanded -->
              <div
                v-if="expandedLabelId === label.id"
                class="expansion-indicator"
              ></div>
            </div>
          </div>
          <!-- Expandable Releases Panel for Labels - Full width below horizontal scroll -->
          <div
            v-if="expandedLabelId && labels.slice(0, 10).some(l => l.id === expandedLabelId)"
            class="versions-panel-row all-view-panel"
            :class="{
              open: expandedLabelId,
              loading: loadingAlbums
            }"
          >
            <div
              v-if="expandedAlbums.length > 0 && !loadingAlbums"
              class="versions-list"
            >
              <a
                v-for="(album, aIndex) in expandedAlbums"
                :key="album.id"
                :href="album.discogs_url"
                target="_blank"
                rel="noopener noreferrer"
                class="version-item"
                :style="{ animationDelay: `${aIndex * 0.05}s` }"
              >
                <div class="version-thumb-wrapper">
                  <img
                    :src="
                      getImageUrl(album) ||
                      '/placeholder-album.png'
                    "
                    :alt="album.title"
                    class="version-thumb"
                    @load="handleVersionImageLoad"
                    @error="handleImageError"
                  />
                </div>
                <div class="version-info">
                  <div class="version-format">{{ album.title }}</div>
                  <div class="version-year" v-if="album.year">{{ album.year }}</div>
                </div>
              </a>
              <a
                v-if="totalAlbumsCount > 10"
                :href="labels.slice(0, 10).find(l => l.id === expandedLabelId)?.discogs_url"
                target="_blank"
                rel="noopener noreferrer"
                class="all-versions-link"
                :style="{ animationDelay: `${expandedAlbums.length * 0.05}s` }"
              >
                All releases
              </a>
            </div>
            <div
              v-else-if="expandedAlbums.length === 0 && !loadingAlbums"
              class="versions-empty"
            >
              No releases found
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div
          v-if="
            releases.length === 0 &&
            artists.length === 0 &&
            labels.length === 0 &&
            hasSearched
          "
          class="no-results"
        >
          No results found for "{{ currentSearchTerm }}"
        </div>
      </div>

      <!-- Filtered Views (Releases/Artists/Labels) -->
      <div v-if="!loading && activeTab !== 'all'">
        <!-- Releases Grid -->
        <div v-if="activeTab === 'releases'" class="grid-section">
          <div v-if="paginatedReleases.length > 0" class="results-grid">
            <template v-for="(release, index) in paginatedReleases" :key="release.id">
              <div
                class="grid-album-card"
                :class="{ 'is-expanded': expandedReleaseId === release.id }"
              >
                <a
                  :href="release.discogs_url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div class="grid-album-cover-wrapper">
                    <img
                      v-if="getImageUrl(release)"
                      :src="getImageUrl(release)"
                      :alt="release.title"
                      class="grid-album-cover"
                      @error="handleImageError"
                    />
                    <div v-else class="image-placeholder">
                      <span class="material-symbols-outlined">album</span>
                    </div>
                  </div>
                </a>
                <div class="grid-album-info">
                  <div class="grid-album-title">{{ release.title }}</div>
                  <div class="grid-album-meta">
                    <span v-if="release.year">{{ release.year }}</span>
                    <span v-if="release.format && release.format.length">{{
                      release.format[0]
                    }}</span>
                  </div>
                  <div
                    class="grid-album-versions-link"
                    v-if="release.type === 'master'"
                    @click="toggleVersions(release)"
                  >
                    View versions
                    <span class="plus-icon">{{
                      expandedReleaseId === release.id ? "−" : "+"
                    }}</span>
                  </div>
                </div>
                <!-- Indicator arrow pointing down when expanded -->
                <div
                  v-if="expandedReleaseId === release.id"
                  class="expansion-indicator"
                ></div>
              </div>
              <!-- Insert versions panel at end of each row if an album in that row is expanded -->
              <div
                v-if="shouldShowVersionsPanelAfter(index)"
                class="versions-panel-row"
                :class="{
                  open: expandedReleaseId,
                  loading: loadingVersions
                }"
              >
                <div
                  v-if="expandedVersions.length > 0 && !loadingVersions"
                  class="versions-list"
                >
                  <a
                    v-for="(version, vIndex) in expandedVersions"
                    :key="version.id"
                    :href="version.discogs_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="version-item"
                    :style="{ animationDelay: `${vIndex * 0.05}s` }"
                  >
                    <div class="version-thumb-wrapper">
                      <img
                        :src="
                          version.thumb ||
                          '/placeholder-album.png'
                        "
                        :alt="version.title"
                        class="version-thumb"
                        @load="handleVersionImageLoad"
                        @error="handleImageError"
                      />
                    </div>
                    <div class="version-info">
                      <div class="version-format">{{ version.format }}</div>
                      <div class="version-year">{{ version.year }}</div>
                      <div class="version-country" v-if="version.country">
                        {{ version.country }}
                      </div>
                    </div>
                  </a>
                  <a
                    v-if="totalVersionsCount > 10"
                    :href="`https://www.discogs.com/master/${expandedReleaseId}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="all-versions-link"
                    :style="{ animationDelay: `${expandedVersions.length * 0.05}s` }"
                  >
                    All versions
                  </a>
                </div>
                <div
                  v-else-if="expandedVersions.length === 0 && !loadingVersions"
                  class="versions-empty"
                >
                  No versions found
                </div>
              </div>
            </template>
          </div>
          <div v-else class="no-results">No releases found</div>

          <!-- Pagination for Releases -->
          <div v-if="totalReleasesPages > 1" class="pagination">
            <button
              v-if="currentReleasesPage > 1"
              class="pagination-btn"
              @click="currentReleasesPage--"
            >
              Previous
            </button>
            <span v-else class="pagination-spacer"></span>
            <span class="pagination-info">
              Page {{ currentReleasesPage }} of {{ totalReleasesPages }}
            </span>
            <button
              v-if="currentReleasesPage < totalReleasesPages"
              class="pagination-btn"
              @click="currentReleasesPage++"
            >
              Next
            </button>
            <span v-else class="pagination-spacer"></span>
          </div>
        </div>

        <!-- Artists Grid -->
        <div v-if="activeTab === 'artists'" class="grid-section">
          <div v-if="paginatedArtists.length > 0" class="results-grid">
            <template v-for="(artist, index) in paginatedArtists" :key="artist.id">
              <div
                class="grid-artist-card"
                :class="{ 'is-expanded': expandedArtistId === artist.id }"
              >
                <a
                  :href="artist.discogs_url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div class="grid-artist-image-wrapper">
                    <img
                      v-if="getImageUrl(artist)"
                      :src="getImageUrl(artist)"
                      :alt="artist.title"
                      class="grid-artist-image"
                      @error="handleImageError"
                    />
                    <div v-else class="image-placeholder">
                      <span class="material-symbols-outlined">person</span>
                    </div>
                  </div>
                </a>
                <div class="grid-artist-info">
                  <div class="grid-artist-name">{{ artist.title }}</div>
                  <div
                    class="grid-artist-albums-link"
                    @click="toggleArtistAlbums(artist)"
                  >
                    View releases
                    <span class="plus-icon">{{
                      expandedArtistId === artist.id ? "−" : "+"
                    }}</span>
                  </div>
                </div>
                <!-- Indicator arrow pointing down when expanded -->
                <div
                  v-if="expandedArtistId === artist.id"
                  class="expansion-indicator"
                ></div>
              </div>
              <!-- Insert albums panel at end of each row if an artist in that row is expanded -->
              <div
                v-if="shouldShowAlbumsPanelAfter(index, paginatedArtists, expandedArtistId)"
                class="versions-panel-row"
                :class="{
                  open: expandedArtistId,
                  loading: loadingAlbums
                }"
              >
                <div
                  v-if="expandedAlbums.length > 0 && !loadingAlbums"
                  class="versions-list"
                >
                  <a
                    v-for="(album, aIndex) in expandedAlbums"
                    :key="album.id"
                    :href="album.discogs_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="version-item"
                    :style="{ animationDelay: `${aIndex * 0.05}s` }"
                  >
                    <div class="version-thumb-wrapper">
                      <img
                        :src="
                          getImageUrl(album) ||
                          '/placeholder-album.png'
                        "
                        :alt="album.title"
                        class="version-thumb"
                        @load="handleVersionImageLoad"
                        @error="handleImageError"
                      />
                    </div>
                    <div class="version-info">
                      <div class="version-format">{{ album.title }}</div>
                      <div class="version-year" v-if="album.year">{{ album.year }}</div>
                    </div>
                  </a>
                  <a
                    v-if="totalAlbumsCount > 10"
                    :href="paginatedArtists.find(a => a.id === expandedArtistId)?.discogs_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="all-versions-link"
                    :style="{ animationDelay: `${expandedAlbums.length * 0.05}s` }"
                  >
                    All releases
                  </a>
                </div>
                <div
                  v-else-if="expandedAlbums.length === 0 && !loadingAlbums"
                  class="versions-empty"
                >
                  No releases found
                </div>
              </div>
            </template>
          </div>
          <div v-else class="no-results">No artists found</div>

          <!-- Pagination for Artists -->
          <div v-if="totalArtistsPages > 1" class="pagination">
            <button
              v-if="currentArtistsPage > 1"
              class="pagination-btn"
              @click="currentArtistsPage--"
            >
              Previous
            </button>
            <span v-else class="pagination-spacer"></span>
            <span class="pagination-info">
              Page {{ currentArtistsPage }} of {{ totalArtistsPages }}
            </span>
            <button
              v-if="currentArtistsPage < totalArtistsPages"
              class="pagination-btn"
              @click="currentArtistsPage++"
            >
              Next
            </button>
            <span v-else class="pagination-spacer"></span>
          </div>
        </div>

        <!-- Labels Grid -->
        <div v-if="activeTab === 'labels'" class="grid-section">
          <div v-if="paginatedLabels.length > 0" class="results-grid">
            <template v-for="(label, index) in paginatedLabels" :key="label.id">
              <div
                class="grid-label-card"
                :class="{ 'is-expanded': expandedLabelId === label.id }"
              >
                <a
                  :href="label.discogs_url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div class="grid-label-image-wrapper">
                    <img
                      v-if="getImageUrl(label)"
                      :src="getImageUrl(label)"
                      :alt="label.title"
                      class="grid-label-image"
                      @error="handleImageError"
                    />
                    <div v-else class="image-placeholder">
                      <span class="material-symbols-outlined">label</span>
                    </div>
                  </div>
                </a>
                <div class="grid-label-info">
                  <div class="grid-label-name">{{ label.title }}</div>
                  <div
                    class="grid-label-albums-link"
                    @click="toggleLabelAlbums(label)"
                  >
                    View releases
                    <span class="plus-icon">{{
                      expandedLabelId === label.id ? "−" : "+"
                    }}</span>
                  </div>
                </div>
                <!-- Indicator arrow pointing down when expanded -->
                <div
                  v-if="expandedLabelId === label.id"
                  class="expansion-indicator"
                ></div>
              </div>
              <!-- Insert albums panel at end of each row if a label in that row is expanded -->
              <div
                v-if="shouldShowAlbumsPanelAfter(index, paginatedLabels, expandedLabelId)"
                class="versions-panel-row"
                :class="{
                  open: expandedLabelId,
                  loading: loadingAlbums
                }"
              >
                <div
                  v-if="expandedAlbums.length > 0 && !loadingAlbums"
                  class="versions-list"
                >
                  <a
                    v-for="(album, aIndex) in expandedAlbums"
                    :key="album.id"
                    :href="album.discogs_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="version-item"
                    :style="{ animationDelay: `${aIndex * 0.05}s` }"
                  >
                    <div class="version-thumb-wrapper">
                      <img
                        :src="
                          getImageUrl(album) ||
                          '/placeholder-album.png'
                        "
                        :alt="album.title"
                        class="version-thumb"
                        @load="handleVersionImageLoad"
                        @error="handleImageError"
                      />
                    </div>
                    <div class="version-info">
                      <div class="version-format">{{ album.title }}</div>
                      <div class="version-year" v-if="album.year">{{ album.year }}</div>
                    </div>
                  </a>
                  <a
                    v-if="totalAlbumsCount > 10"
                    :href="paginatedLabels.find(l => l.id === expandedLabelId)?.discogs_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="all-versions-link"
                    :style="{ animationDelay: `${expandedAlbums.length * 0.05}s` }"
                  >
                    All releases
                  </a>
                </div>
                <div
                  v-else-if="expandedAlbums.length === 0 && !loadingAlbums"
                  class="versions-empty"
                >
                  No releases found
                </div>
              </div>
            </template>
          </div>
          <div v-else class="no-results">No labels found</div>

          <!-- Pagination for Labels -->
          <div v-if="totalLabelsPages > 1" class="pagination">
            <button
              v-if="currentLabelsPage > 1"
              class="pagination-btn"
              @click="currentLabelsPage--"
            >
              Previous
            </button>
            <span v-else class="pagination-spacer"></span>
            <span class="pagination-info">
              Page {{ currentLabelsPage }} of {{ totalLabelsPages }}
            </span>
            <button
              v-if="currentLabelsPage < totalLabelsPages"
              class="pagination-btn"
              @click="currentLabelsPage++"
            >
              Next
            </button>
            <span v-else class="pagination-spacer"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  searchDiscogsUniversal,
  getMasterTopVersions,
  getMasterVersionCount,
} from "../services/discogs.js";
import FilterSidebar from "../components/FilterSidebar.vue";

export default {
  name: "SearchResults",
  components: {
    FilterSidebar,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const searchQuery = ref("");
    const currentSearchTerm = ref("");
    const releases = ref([]);
    const artists = ref([]);
    const labels = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const hasSearched = ref(false);
    const activeTab = ref("all");
    const sortBy = ref("relevance");
    const mobileSidebarOpen = ref(false);
    const isMobileView = ref(false);

    // Pagination
    const itemsPerPage = 24;
    const cacheSize = 100; // Used for all types - fetch 100 items at once
    const currentReleasesPage = ref(1);
    const currentArtistsPage = ref(1);
    const currentLabelsPage = ref(1);
    const totalReleasesCount = ref(0);
    const totalArtistsCount = ref(0);
    const totalLabelsCount = ref(0);

    // Cache for fetched data
    const releasesCache = ref([]); // Merged and deduplicated releases
    const artistsCache = ref([]);
    const labelsCache = ref([]);

    // Expanded versions state
    const expandedReleaseId = ref(null);
    const expandedVersions = ref([]);
    const loadingVersions = ref(false);
    const totalVersionsCount = ref(0);

    // Expanded albums state for artists/labels
    const expandedArtistId = ref(null);
    const expandedLabelId = ref(null);
    const expandedAlbums = ref([]);
    const loadingAlbums = ref(false);
    const totalAlbumsCount = ref(0);
    const albumsCache = ref(new Map()); // Cache albums by artist/label name

    // Filter state
    const showFilters = computed(() => activeTab.value === "releases");
    const activeFilters = ref({
      formats: [],
      countries: [],
      decades: [],
      genres: [],
      styles: [],
    });

    const performSearch = async () => {
      if (searchQuery.value.trim()) {
        router.push({
          path: "/results",
          query: { q: searchQuery.value },
        });
      }
    };

    // Aggregated filter options
    const availableFormats = ref([]);
    const availableCountries = ref([]);
    const availableGenres = ref([]);
    const availableStyles = ref([]);
    const availableDecades = ref([]);

    const aggregateFilterOptions = (releasesList) => {
      // Aggregate formats
      const formatCounts = {};
      releasesList.forEach((release) => {
        if (release.format && Array.isArray(release.format)) {
          release.format.forEach((format) => {
            formatCounts[format] = (formatCounts[format] || 0) + 1;
          });
        }
      });

      // Aggregate countries
      const countryCounts = {};
      releasesList.forEach((release) => {
        if (release.country) {
          countryCounts[release.country] =
            (countryCounts[release.country] || 0) + 1;
        }
      });

      // Aggregate genres
      const genreCounts = {};
      releasesList.forEach((release) => {
        if (release.genre && Array.isArray(release.genre)) {
          release.genre.forEach((genre) => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          });
        }
      });

      // Aggregate styles
      const styleCounts = {};
      releasesList.forEach((release) => {
        if (release.style && Array.isArray(release.style)) {
          release.style.forEach((style) => {
            styleCounts[style] = (styleCounts[style] || 0) + 1;
          });
        }
      });

      // Sort by count and get top options
      availableFormats.value = Object.entries(formatCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([format]) => format);

      availableCountries.value = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([country]) => country);

      availableGenres.value = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([genre]) => genre);

      availableStyles.value = Object.entries(styleCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([style]) => style);

      // Aggregate decades
      const decadeCounts = {};
      releasesList.forEach((release) => {
        if (release.year) {
          const yearNum = parseInt(release.year);
          if (!isNaN(yearNum)) {
            const decade = Math.floor(yearNum / 10) * 10;
            decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
          }
        }
      });

      availableDecades.value = Object.entries(decadeCounts)
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0])) // Sort by decade descending
        .map(([decade]) => parseInt(decade));
    };

    // Fetch initial results for "All" view
    const fetchResults = async (query) => {
      if (!query) return;

      loading.value = true;
      error.value = null;
      hasSearched.value = true;
      currentSearchTerm.value = query;

      try {
        // Fetch masters, releases, artists, and labels in parallel
        const [mastersData, releasesData, artistsData, labelsData] =
          await Promise.all([
            searchDiscogsUniversal(query, 50, 1, "master"),
            searchDiscogsUniversal(query, 50, 1, "release"),
            searchDiscogsUniversal(query, 50, 1, "artist"),
            searchDiscogsUniversal(query, 50, 1, "label"),
          ]);

        // Filter releases to only include orphans (no master_id)
        const orphanReleases = releasesData.results.filter((r) => !r.master_id);

        // Merge masters and orphan releases
        const mergedReleases = [...mastersData.results, ...orphanReleases];

        // Remove duplicates
        const seenIds = new Set();
        releases.value = mergedReleases.filter((item) => {
          if (seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });

        artists.value = artistsData.results;
        labels.value = labelsData.results;

        // Store total counts from API pagination
        totalReleasesCount.value =
          mastersData.total +
          Math.floor(orphanReleases.length * (releasesData.total / 50));
        totalArtistsCount.value = artistsData.total || 0;
        totalLabelsCount.value = labelsData.total || 0;

        // Aggregate filter options from releases
        aggregateFilterOptions(releases.value);
      } catch (err) {
        error.value = err.message || "Failed to fetch search results";
        console.error("Search error:", err);
      } finally {
        loading.value = false;
      }
    };

    // Fetch releases in batches of 100 (like artists/labels)
    const fetchReleasesPage = async (page) => {
      if (!currentSearchTerm.value) return;

      // Calculate which cache batch we need
      const cacheBatch = Math.ceil(page / 4); // 4 pages of 24 items = ~100 items
      const cacheEnd = cacheBatch * cacheSize;

      if (releasesCache.value.length < cacheEnd || page === 1) {
        loading.value = true;
        error.value = null;

        try {
          // Fetch both masters and releases in parallel (100 items each)
          const [mastersData, releasesData] = await Promise.all([
            searchDiscogsUniversal(
              currentSearchTerm.value,
              cacheSize,
              cacheBatch,
              "master"
            ),
            searchDiscogsUniversal(
              currentSearchTerm.value,
              cacheSize,
              cacheBatch,
              "release"
            ),
          ]);

          // Filter releases to only include orphans (no master_id)
          const orphanReleases = releasesData.results.filter((r) => !r.master_id);

          // Merge masters and orphan releases
          const mergedResults = [...mastersData.results, ...orphanReleases];

          // Remove duplicates (in case a release and its master both appear)
          const seenIds = new Set();
          const uniqueResults = mergedResults.filter((item) => {
            if (seenIds.has(item.id)) return false;
            seenIds.add(item.id);
            return true;
          });

          // Update cache
          if (cacheBatch === 1) {
            releasesCache.value = uniqueResults;
          } else {
            releasesCache.value = [...releasesCache.value, ...uniqueResults];
          }

          // Estimate total count
          const estimatedTotal =
            mastersData.total +
            Math.floor(
              orphanReleases.length * (releasesData.total / cacheSize)
            );
          totalReleasesCount.value = Math.max(mastersData.total, estimatedTotal);

          // Update filter options from all cached results
          aggregateFilterOptions(releasesCache.value);
        } catch (err) {
          error.value = err.message || "Failed to fetch releases";
          console.error("Releases fetch error:", err);
        } finally {
          loading.value = false;
        }
      }
    };

    // Fetch artists for a specific page with caching
    const fetchArtistsPage = async (page) => {
      if (!currentSearchTerm.value) return;

      // Calculate which cache batch we need
      const cacheBatch = Math.ceil(page / 4);

      const cacheEnd = cacheBatch * cacheSize;

      if (artistsCache.value.length < cacheEnd || page === 1) {
        loading.value = true;
        error.value = null;

        try {
          // Fetch 100 items at once using type filter
          const data = await searchDiscogsUniversal(
            currentSearchTerm.value,
            cacheSize,
            cacheBatch,
            "artist"
          );

          // Update cache
          if (cacheBatch === 1) {
            artistsCache.value = data.results;
          } else {
            artistsCache.value = [...artistsCache.value, ...data.results];
          }

          totalArtistsCount.value = data.total || 0;
        } catch (err) {
          error.value = err.message || "Failed to fetch artists";
          console.error("Artists fetch error:", err);
        } finally {
          loading.value = false;
        }
      }
    };

    // Fetch labels for a specific page with caching
    const fetchLabelsPage = async (page) => {
      if (!currentSearchTerm.value) return;

      // Calculate which cache batch we need
      const cacheBatch = Math.ceil(page / 4);

      const cacheEnd = cacheBatch * cacheSize;

      if (labelsCache.value.length < cacheEnd || page === 1) {
        loading.value = true;
        error.value = null;

        try {
          // Fetch 100 items at once using type filter
          const data = await searchDiscogsUniversal(
            currentSearchTerm.value,
            cacheSize,
            cacheBatch,
            "label"
          );

          // Update cache
          if (cacheBatch === 1) {
            labelsCache.value = data.results;
          } else {
            labelsCache.value = [...labelsCache.value, ...data.results];
          }

          totalLabelsCount.value = data.total || 0;
        } catch (err) {
          error.value = err.message || "Failed to fetch labels";
          console.error("Labels fetch error:", err);
        } finally {
          loading.value = false;
        }
      }
    };

    const isPlaceholderImage = (url) => {
      if (!url) return true;
      return url.includes("spacer.gif") || url.includes("placeholder");
    };

    const handleImageError = (e) => {
      showPlaceholder(e.target);
    };

    const handleVersionImageLoad = (e) => {
      e.target.classList.add('loaded');
    };

    const showPlaceholder = (imgElement) => {
      imgElement.style.display = "none";
      const parent = imgElement.parentElement;
      if (parent && !parent.querySelector(".image-placeholder")) {
        const placeholder = document.createElement("div");
        placeholder.className = "image-placeholder";

        // Determine if it's a release, artist, or label based on parent classes
        if (
          parent.classList.contains("album-cover-wrapper") ||
          parent.classList.contains("grid-album-cover-wrapper")
        ) {
          placeholder.innerHTML = '<span class="material-symbols-outlined">album</span>';
        } else if (
          parent.classList.contains("artist-image") ||
          parent.classList.contains("grid-artist-image-wrapper")
        ) {
          placeholder.innerHTML = '<span class="material-symbols-outlined">person</span>';
        } else {
          placeholder.innerHTML = '<span class="material-symbols-outlined">label</span>';
        }

        parent.appendChild(placeholder);
      }
    };

    const getImageUrl = (item) => {
      const url = item.cover_image || item.thumb || "";
      return isPlaceholderImage(url) ? "" : url;
    };

    const setTab = async (tab) => {
      activeTab.value = tab;
      // Reset pagination when changing tabs
      currentReleasesPage.value = 1;
      currentArtistsPage.value = 1;
      currentLabelsPage.value = 1;

      // Fetch data for the selected tab if cache is empty
      if (tab === "releases" && releasesCache.value.length === 0) {
        await fetchReleasesPage(1);
      } else if (tab === "artists" && artistsCache.value.length === 0) {
        fetchArtistsPage(1);
      } else if (tab === "labels" && labelsCache.value.length === 0) {
        fetchLabelsPage(1);
      }
    };

    const handleFilterChange = (filters) => {
      activeFilters.value = filters;
      // Reset pagination when filters change
      currentReleasesPage.value = 1;
      currentArtistsPage.value = 1;
      currentLabelsPage.value = 1;
    };

    // Check if versions panel should be shown after this index
    const shouldShowVersionsPanelAfter = (index) => {
      if (!expandedReleaseId.value) return false;

      const itemsPerRow = 4;
      const expandedIndex = paginatedReleases.value.findIndex(
        r => r.id === expandedReleaseId.value
      );

      if (expandedIndex === -1) return false;

      // Get the row of the expanded album
      const expandedRow = Math.floor(expandedIndex / itemsPerRow);
      const currentRow = Math.floor(index / itemsPerRow);

      // Show panel after the last item in the expanded album's row
      const isLastInRow = (index + 1) % itemsPerRow === 0;
      const isLastItem = index === paginatedReleases.value.length - 1;

      return currentRow === expandedRow && (isLastInRow || isLastItem);
    };

    // Check if albums panel should be shown after this index (for artists/labels)
    const shouldShowAlbumsPanelAfter = (index, items, expandedId) => {
      if (!expandedId) return false;

      const itemsPerRow = 4;
      const expandedIndex = items.findIndex(item => item.id === expandedId);

      if (expandedIndex === -1) return false;

      // Get the row of the expanded item
      const expandedRow = Math.floor(expandedIndex / itemsPerRow);
      const currentRow = Math.floor(index / itemsPerRow);

      // Show panel after the last item in the expanded item's row
      const isLastInRow = (index + 1) % itemsPerRow === 0;
      const isLastItem = index === items.length - 1;

      return currentRow === expandedRow && (isLastInRow || isLastItem);
    };

    // Toggle versions panel for a release
    const toggleVersions = async (release) => {
      // If clicking the same release, close it
      if (expandedReleaseId.value === release.id) {
        expandedReleaseId.value = null;
        expandedVersions.value = [];
        totalVersionsCount.value = 0;
        return;
      }

      // Open new release and fetch versions
      expandedReleaseId.value = release.id;
      expandedVersions.value = [];
      totalVersionsCount.value = 0;
      loadingVersions.value = true;

      try {
        // Fetch versions and get total count
        const versionsData = await getMasterTopVersions(release.id, 10);
        expandedVersions.value = versionsData;
        // Get total count from the release's version_count or fetch it
        const versionCount = await getMasterVersionCount(release.id);
        totalVersionsCount.value = versionCount || 0;
      } catch (err) {
        console.error("Failed to fetch versions:", err);
        expandedVersions.value = [];
        totalVersionsCount.value = 0;
      } finally {
        loadingVersions.value = false;
      }
    };

    // Toggle albums panel for an artist
    const toggleArtistAlbums = async (artist) => {
      // If clicking the same artist, close it
      if (expandedArtistId.value === artist.id) {
        expandedArtistId.value = null;
        expandedAlbums.value = [];
        totalAlbumsCount.value = 0;
        return;
      }

      // Open new artist
      expandedArtistId.value = artist.id;
      expandedAlbums.value = [];
      totalAlbumsCount.value = 0;

      // Check cache first
      if (albumsCache.value.has(artist.title)) {
        const cached = albumsCache.value.get(artist.title);
        expandedAlbums.value = cached.albums;
        totalAlbumsCount.value = cached.total;
        return;
      }

      loadingAlbums.value = true;

      try {
        // Fetch masters and releases for this artist
        const [mastersData, releasesData] = await Promise.all([
          searchDiscogsUniversal(artist.title, 50, 1, "master"),
          searchDiscogsUniversal(artist.title, 50, 1, "release"),
        ]);

        // Filter releases to only include orphans (no master_id)
        const orphanReleases = releasesData.results.filter((r) => !r.master_id);

        // Merge masters and orphan releases
        const mergedReleases = [...mastersData.results, ...orphanReleases];

        // Remove duplicates
        const seenIds = new Set();
        const uniqueReleases = mergedReleases.filter((item) => {
          if (seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });

        // Store total count
        const totalCount = uniqueReleases.length;
        totalAlbumsCount.value = totalCount;

        // Take top 10
        const topAlbums = uniqueReleases.slice(0, 10);

        // Cache the results with total count
        albumsCache.value.set(artist.title, { albums: topAlbums, total: totalCount });
        expandedAlbums.value = topAlbums;
      } catch (err) {
        console.error("Failed to fetch artist albums:", err);
        expandedAlbums.value = [];
        totalAlbumsCount.value = 0;
      } finally {
        loadingAlbums.value = false;
      }
    };

    // Toggle albums panel for a label
    const toggleLabelAlbums = async (label) => {
      // If clicking the same label, close it
      if (expandedLabelId.value === label.id) {
        expandedLabelId.value = null;
        expandedAlbums.value = [];
        totalAlbumsCount.value = 0;
        return;
      }

      // Open new label
      expandedLabelId.value = label.id;
      expandedAlbums.value = [];
      totalAlbumsCount.value = 0;

      // Check cache first
      if (albumsCache.value.has(label.title)) {
        const cached = albumsCache.value.get(label.title);
        expandedAlbums.value = cached.albums;
        totalAlbumsCount.value = cached.total;
        return;
      }

      loadingAlbums.value = true;

      try {
        // Fetch masters and releases for this label
        const [mastersData, releasesData] = await Promise.all([
          searchDiscogsUniversal(label.title, 50, 1, "master"),
          searchDiscogsUniversal(label.title, 50, 1, "release"),
        ]);

        // Filter releases to only include orphans (no master_id)
        const orphanReleases = releasesData.results.filter((r) => !r.master_id);

        // Merge masters and orphan releases
        const mergedReleases = [...mastersData.results, ...orphanReleases];

        // Remove duplicates
        const seenIds = new Set();
        const uniqueReleases = mergedReleases.filter((item) => {
          if (seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });

        // Store total count
        const totalCount = uniqueReleases.length;
        totalAlbumsCount.value = totalCount;

        // Take top 10
        const topAlbums = uniqueReleases.slice(0, 10);

        // Cache the results with total count
        albumsCache.value.set(label.title, { albums: topAlbums, total: totalCount });
        expandedAlbums.value = topAlbums;
      } catch (err) {
        console.error("Failed to fetch label albums:", err);
        expandedAlbums.value = [];
        totalAlbumsCount.value = 0;
      } finally {
        loadingAlbums.value = false;
      }
    };

    // Filtered results based on active filters (client-side filtering)
    const filteredReleases = computed(() => {
      let results = [...releasesCache.value];

      // Apply format filter
      if (activeFilters.value.formats.length > 0) {
        results = results.filter((release) => {
          if (!release.format || release.format.length === 0) return false;
          return activeFilters.value.formats.some((filter) =>
            release.format.some((f) =>
              f.toLowerCase().includes(filter.toLowerCase())
            )
          );
        });
      }

      // Apply country filter
      if (activeFilters.value.countries.length > 0) {
        results = results.filter((release) => {
          if (!release.country) return false;
          return activeFilters.value.countries.includes(release.country);
        });
      }

      // Apply decade filter
      if (activeFilters.value.decades.length > 0) {
        results = results.filter((release) => {
          if (!release.year) return false;
          const yearNum = parseInt(release.year);
          return activeFilters.value.decades.some((decade) => {
            const decadeNum = parseInt(decade);
            return yearNum >= decadeNum && yearNum < decadeNum + 10;
          });
        });
      }

      // Apply genre filter
      if (activeFilters.value.genres.length > 0) {
        results = results.filter((release) => {
          if (!release.genre || release.genre.length === 0) return false;
          return activeFilters.value.genres.some((filter) =>
            release.genre.some((g) =>
              g.toLowerCase().includes(filter.toLowerCase())
            )
          );
        });
      }

      // Apply style filter
      if (activeFilters.value.styles.length > 0) {
        results = results.filter((release) => {
          if (!release.style || release.style.length === 0) return false;
          return activeFilters.value.styles.some((filter) =>
            release.style.some((s) =>
              s.toLowerCase().includes(filter.toLowerCase())
            )
          );
        });
      }

      // Apply sorting
      if (sortBy.value === "year-desc") {
        results.sort((a, b) => (b.year || 0) - (a.year || 0));
      } else if (sortBy.value === "year-asc") {
        results.sort((a, b) => (a.year || 0) - (b.year || 0));
      } else if (sortBy.value === "title") {
        results.sort((a, b) => a.title.localeCompare(b.title));
      }

      return results;
    });

    // Watch for page changes and fetch new data if needed
    watch(currentReleasesPage, async (newPage) => {
      if (activeTab.value === "releases") {
        // Fetch the batch if not cached
        await fetchReleasesPage(newPage);
      }
    });

    watch(currentArtistsPage, (newPage) => {
      if (activeTab.value === "artists") {
        fetchArtistsPage(newPage);
      }
    });

    watch(currentLabelsPage, (newPage) => {
      if (activeTab.value === "labels") {
        fetchLabelsPage(newPage);
      }
    });

    const filteredArtists = computed(() => {
      let results = [...artistsCache.value];

      if (sortBy.value === "title") {
        results.sort((a, b) => a.title.localeCompare(b.title));
      }

      return results;
    });

    const filteredLabels = computed(() => {
      let results = [...labelsCache.value];

      if (sortBy.value === "title") {
        results.sort((a, b) => a.title.localeCompare(b.title));
      }

      return results;
    });

    // Client-side pagination from cache
    const paginatedReleases = computed(() => {
      const filtered = filteredReleases.value;
      const startIndex = (currentReleasesPage.value - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filtered.slice(startIndex, endIndex);
    });

    const paginatedArtists = computed(() => {
      const filtered = filteredArtists.value;
      const startIndex = (currentArtistsPage.value - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filtered.slice(startIndex, endIndex);
    });

    const paginatedLabels = computed(() => {
      const filtered = filteredLabels.value;
      const startIndex = (currentLabelsPage.value - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filtered.slice(startIndex, endIndex);
    });

    // Total pages based on filtered results or actual cache
    const totalReleasesPages = computed(() => {
      // If filtering is active, calculate based on filtered results
      if (
        activeFilters.value.formats.length > 0 ||
        activeFilters.value.countries.length > 0 ||
        activeFilters.value.decades.length > 0 ||
        activeFilters.value.genres.length > 0 ||
        activeFilters.value.styles.length > 0
      ) {
        return Math.ceil(filteredReleases.value.length / itemsPerPage);
      }
      // If we have cached data, use the cache length to determine pages
      // This ensures we only show pages with actual content
      if (releasesCache.value.length > 0) {
        // Use cache length, but also consider if there might be more data
        // If cache length is a multiple of cacheSize, there might be more
        const cachePages = Math.ceil(releasesCache.value.length / itemsPerPage);
        const estimatedPages = Math.ceil(totalReleasesCount.value / itemsPerPage);
        // Use the smaller of the two to avoid empty pages
        return Math.min(cachePages, estimatedPages);
      }
      // Fallback to API estimate
      return Math.ceil(totalReleasesCount.value / itemsPerPage);
    });

    const totalArtistsPages = computed(() => {
      // Use filtered count if sorting is applied, otherwise use API total
      if (
        filteredArtists.value.length > 0 &&
        filteredArtists.value.length < totalArtistsCount.value
      ) {
        return Math.ceil(filteredArtists.value.length / itemsPerPage);
      }
      return Math.ceil(totalArtistsCount.value / itemsPerPage);
    });

    const totalLabelsPages = computed(() => {
      // Use filtered count if sorting is applied, otherwise use API total
      if (
        filteredLabels.value.length > 0 &&
        filteredLabels.value.length < totalLabelsCount.value
      ) {
        return Math.ceil(filteredLabels.value.length / itemsPerPage);
      }
      return Math.ceil(totalLabelsCount.value / itemsPerPage);
    });

    // Mobile responsive handlers
    const checkMobileView = () => {
      isMobileView.value = window.innerWidth <= 1024;
      if (!isMobileView.value) {
        mobileSidebarOpen.value = false;
      }
    };

    const toggleMobileSidebar = () => {
      mobileSidebarOpen.value = !mobileSidebarOpen.value;
    };

    const closeSidebar = () => {
      mobileSidebarOpen.value = false;
    };

    onMounted(() => {
      checkMobileView();
      window.addEventListener("resize", checkMobileView);
    });

    onUnmounted(() => {
      window.removeEventListener("resize", checkMobileView);
    });

    // Watch for route query changes
    watch(
      () => route.query.q,
      async (newQuery, oldQuery) => {
        if (newQuery && newQuery !== oldQuery) {
          searchQuery.value = newQuery;
          currentSearchTerm.value = newQuery;
          // Clear all caches on new search
          releasesCache.value = [];
          artistsCache.value = [];
          labelsCache.value = [];
          // Reset pagination
          currentReleasesPage.value = 1;
          currentArtistsPage.value = 1;
          currentLabelsPage.value = 1;

          // Fetch results for "All" view first
          await fetchResults(newQuery);

          // If on a filtered tab, fetch that specific data
          if (activeTab.value === "releases") {
            // Fetch first 100 releases (includes version counts for first page)
            await fetchReleasesPage(1);
          } else if (activeTab.value === "artists") {
            await fetchArtistsPage(1);
          } else if (activeTab.value === "labels") {
            await fetchLabelsPage(1);
          }

          // Keep the current tab unless it's the first search
          if (!oldQuery) {
            activeTab.value = "all";
          }
        }
      },
      { immediate: true }
    );

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
      availableFormats,
      availableCountries,
      availableGenres,
      availableStyles,
      availableDecades,
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
      handleVersionImageLoad,
      getImageUrl,
      setTab,
      handleFilterChange,
      shouldShowVersionsPanelAfter,
      shouldShowAlbumsPanelAfter,
      toggleVersions,
      expandedReleaseId,
      expandedVersions,
      loadingVersions,
      totalVersionsCount,
      expandedArtistId,
      expandedLabelId,
      expandedAlbums,
      loadingAlbums,
      totalAlbumsCount,
      toggleArtistAlbums,
      toggleLabelAlbums,
      mobileSidebarOpen,
      isMobileView,
      toggleMobileSidebar,
      closeSidebar,
    };
  },
};
</script>

<style scoped>
.results-page {
  position: relative;
  min-height: calc(100vh - 70px);
  padding: 0 20px;
  margin-top: 70px;
}

.content-wrapper {
  max-width: 85%;
  margin: 0 auto;
  padding: 40px 40px;
  border-left: 2px solid #000000;
  border-right: 2px solid #000000;
  min-height: calc(100vh - 70px);
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.3s ease;
}

.content-wrapper.with-sidebar {
  margin-left: calc(280px + 2%);
  border-left-color: transparent;
  border-right-color: transparent;
}

/* Header Hamburger Button */
.header-hamburger-btn {
  position: fixed;
  top: 0;
  right: 2.5%;
  height: 70px;
  background: none;
  border: none;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;
  z-index: 101;
}

.header-hamburger-btn:hover {
  opacity: 0.7;
}

.header-hamburger-btn .material-symbols-outlined {
  color: #ffffff;
  font-size: 28px;
}

/* Mobile Sidebar Overlay */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-with-button {
  display: flex;
  gap: 16px;
  align-items: center;
  max-width: 794px;
  margin: 0 auto 40px;
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

/* Tabs */
.tabs-container-wrapper {
  position: relative;
  margin-left: -40px;
  margin-right: -40px;
  padding-left: 40px;
  padding-right: 40px;
  border-bottom: 2px solid #000000;
  margin-bottom: 32px;
}

.content-wrapper.with-sidebar .tabs-container-wrapper {
  margin-left: calc(-40px - 280px - 2%);
  margin-right: calc(-40px - 2.5% - 20px);
  padding-left: calc(40px + 280px + 2%);
  padding-right: calc(40px + 2.5% + 20px);
}

.tabs-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #717171;
  background: transparent;
  border: none;
  padding: 12px 24px;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.tab-btn:hover {
  color: #000000;
}

.tab-btn.active {
  color: #000000;
}

.tab-btn.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 75%;
  height: 4px;
  background: #000000;
}

/* Sort dropdown */
.sort-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sort-label {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
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
  border: none;
  border-radius: 0;
  padding: 8px 32px 8px 16px;
  cursor: pointer;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.sort-arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 24px;
  color: #000000;
  font-variation-settings: 'FILL' 0, 'wght' 400;
}

.loading,
.error,
.no-results {
  text-align: center;
  font-family: "Inria Sans", sans-serif;
  font-size: 1.2rem;
  color: #717171;
  padding: 40px 20px;
}

.error {
  color: #dc3545;
}

/* Section styles */
.section {
  margin-bottom: 48px;
}

.section-divider {
  margin-left: -40px;
  margin-right: -40px;
  margin-bottom: 30px;
  border-bottom: 2px solid #000000;
}

.section-header-no-border {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 30px;
  margin-left: -40px;
  margin-right: -40px;
  padding-left: 40px;
  padding-right: 40px;
  padding-top: 8px;
  border-top: 2px solid #000000;
}

.section-title {
  font-family: "Inria Sans", sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: #000000;
  margin: 0;
}

.view-all-link {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.2s;
}

.view-all-link:hover {
  opacity: 0.7;
}

/* Wrapper for albums section with versions panel */
.albums-section-wrapper {
  position: relative;
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
  position: relative;
  transition: transform 0.3s ease;
}

.album-card.is-expanded {
  transform: translateY(-4px);
}

.album-card a,
.artist-card a,
.label-card a,
.grid-album-card a,
.grid-artist-card a,
.grid-label-card a {
  text-decoration: none;
}

.album-cover {
  width: 240px;
  height: 240px;
  object-fit: cover;
  border-radius: 0px;
  margin-bottom: 12px;
}

/* Image Placeholders */
.image-placeholder {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder .material-symbols-outlined {
  font-size: 64px;
  color: #d0d0d0;
  text-decoration: none;
}

a .image-placeholder {
  text-decoration: none;
}

.album-cover-wrapper,
.grid-album-cover-wrapper {
  position: relative;
  width: 240px;
  height: 240px;
}

.grid-album-cover-wrapper {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
}

.grid-artist-image-wrapper .image-placeholder,
.artist-image.image-placeholder {
  border-radius: 50%;
}

.album-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.album-title {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  line-height: 1.4;
  max-width: 240px;
  min-height: calc(1.4em * 2); /* Always reserve space for 2 lines */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.album-meta {
  font-family: "Inria Sans", sans-serif;
  font-size: 12px;
  color: #717171;
}

.album-versions-link {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 4px;
  border-bottom: 2px solid #000000;
  transition: opacity 0.2s;
}

.album-versions-link:hover {
  opacity: 0.7;
}

.plus-icon {
  font-size: 20px;
  font-weight: 700;
  transition: transform 0.3s ease;
}

.album-versions-link:hover .plus-icon,
.grid-album-versions-link:hover .plus-icon {
  transform: rotate(90deg);
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
}

.artist-info {
  text-align: center;
  width: 100%;
}

.artist-name {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  line-height: 1.4;
  max-width: 240px;
  min-height: calc(1.4em * 2); /* Always reserve space for 2 lines */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.artist-releases-link {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 4px;
  border-bottom: 2px solid #000000;
  transition: opacity 0.2s;
  margin-top: 4px;
}

.artist-releases-link:hover {
  opacity: 0.7;
}

.artist-card.is-expanded {
  transform: translateY(-4px);
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
}

.label-info {
  text-align: center;
  width: 100%;
}

.label-name {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  line-height: 1.4;
  max-width: 240px;
  min-height: calc(1.4em * 2); /* Always reserve space for 2 lines */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.label-releases-link {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 4px;
  border-bottom: 2px solid #000000;
  transition: opacity 0.2s;
  margin-top: 4px;
}

.label-releases-link:hover {
  opacity: 0.7;
}

.label-card.is-expanded {
  transform: translateY(-4px);
}

/* Grid Layout for Filtered Views - 4 columns */
.grid-section {
  margin-bottom: 40px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
  align-items: start;
}

.grid-album-card,
.grid-artist-card,
.grid-label-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  position: relative;
  transition: transform 0.3s ease;
}

.grid-album-card.is-expanded {
  transform: translateY(-4px);
}

.expansion-indicator {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 12px solid #000000;
  z-index: 10;
  animation: indicatorBounce 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes indicatorBounce {
  0% {
    opacity: 0;
    bottom: -5px;
  }
  50% {
    opacity: 1;
  }
  100% {
    bottom: -15px;
  }
}

.grid-album-cover-wrapper {
  width: 100%;
  max-width: 100%;
  aspect-ratio: 1;
  margin-bottom: 12px;
  border-radius: 0px;
  overflow: hidden;
  flex-shrink: 0;
}

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
  display: block;
}

.grid-artist-image-wrapper {
  border-radius: 50%;
}

.grid-artist-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.grid-album-info,
.grid-artist-info,
.grid-label-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.grid-artist-info {
  text-align: center;
}

.grid-album-title,
.grid-artist-name,
.grid-label-name {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #000000;
  line-height: 1.4;
  min-height: calc(1.4em * 2); /* Always reserve space for 2 lines */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.grid-album-meta {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  color: #000000;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.grid-album-versions {
  font-family: "Inria Sans", sans-serif;
  font-size: 12px;
  color: #717171;
}

.grid-album-versions-link {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 4px;
  border-bottom: 2px solid #000000;
  transition: opacity 0.2s;
}

.grid-album-versions-link:hover {
  opacity: 0.7;
}

.grid-artist-albums-link,
.grid-label-albums-link {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 4px;
  border-bottom: 2px solid #000000;
  transition: opacity 0.2s;
  margin-top: 4px;
}

.grid-artist-albums-link:hover,
.grid-label-albums-link:hover {
  opacity: 0.7;
}

/* Expandable Versions Panel - Full Width Row */
.versions-panel-row {
  grid-column: 1 / -1;
  max-height: 0;
  opacity: 0;
  padding: 0 16px;
  margin-top: 0;
  background: #f8f8f8;
  border-radius: 8px;
  border: 1px solid transparent;
  box-sizing: border-box;
  overflow: hidden;
  transition: max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.versions-panel-row.open {
  max-height: 200px;
  opacity: 1;
  padding: 16px;
  margin-top: 0;
  margin-bottom: 0;
  border-color: #e0e0e0;
}

.versions-panel-row.loading {
  opacity: 0.5;
}

/* Expandable Versions Panel - Old style for "All" view */
.versions-panel {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  padding: 0 16px;
  background: #f8f8f8;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-sizing: border-box;
}

.grid-album-card .versions-panel {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.versions-panel.open {
  max-height: 200px;
  opacity: 1;
  margin-top: 16px;
  padding: 16px;
  border-color: #e0e0e0;
  overflow: hidden;
}

.versions-panel.loading {
  opacity: 0.5;
}

.versions-loading,
.versions-empty {
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  color: #717171;
  text-align: center;
  padding: 20px 0;
}

.versions-panel-row .versions-list {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 0px;
  scrollbar-width: thin;
  scrollbar-color: #919191 #f0f0f0;
  min-width: 0;
  flex-shrink: 0;
}

.versions-panel-row .versions-list::-webkit-scrollbar {
  height: 8px;
}

.versions-panel-row .versions-list::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.versions-panel-row .versions-list::-webkit-scrollbar-thumb {
  background: #919191;
  border-radius: 4px;
}

.versions-list {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 0px;
  scrollbar-width: thin;
  scrollbar-color: #cccccc transparent;
  min-width: 0;
  flex-shrink: 0;
}

.versions-list::-webkit-scrollbar {
  height: 6px;
}

.versions-list::-webkit-scrollbar-track {
  background: transparent;
}

.versions-list::-webkit-scrollbar-thumb {
  background: #cccccc;
  border-radius: 3px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.version-item {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: inherit;
  width: 90px;
  opacity: 0;
  animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.version-item:hover {
  transform: translateY(-2px);
}

.version-thumb-wrapper {
  width: 90px;
  height: 90px;
  border-radius: 4px;
  margin-bottom: 8px;
  background: #d9d9d9;
  overflow: hidden;
  position: relative;
}

.version-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.4s ease-in-out;
}

.version-thumb.loaded {
  opacity: 1;
}

.version-info {
  text-align: center;
  width: 100%;
}

.version-format {
  font-family: "Inria Sans", sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.version-year {
  font-family: "Inria Sans", sans-serif;
  font-size: 11px;
  color: #717171;
}

.version-country {
  font-family: "Inria Sans", sans-serif;
  font-size: 10px;
  color: #919191;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.all-versions-link {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #000000;
  width: 90px;
  height: 90px;
  font-family: "Inria Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  opacity: 0;
  animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  transition: opacity 0.2s;
  margin-bottom: 8px;
}

.all-versions-link:hover {
  opacity: 0.7;
}

/* All View Versions Panel - Full width below horizontal scroll */
.all-view-panel {
  width: 100%;
  max-height: 0;
  opacity: 0;
  padding: 0;
  margin-top: 0;
  background: #f8f8f8;
  border-radius: 8px;
  border: 1px solid transparent;
  box-sizing: border-box;
  overflow: hidden;
  transition: max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.all-view-panel.open {
  max-height: 200px;
  opacity: 1;
  padding: 16px;
  margin-top: 16px;
  border-color: #e0e0e0;
}

.all-view-panel.loading {
  opacity: 0.5;
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
  font-family: "Inria Sans", sans-serif;
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

.pagination-spacer {
  width: 100px;
  display: inline-block;
}

.pagination-info {
  font-family: "Inria Sans", sans-serif;
  font-size: 16px;
  color: #000000;
}

@media (max-width: 1400px) {
  .results-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .content-wrapper {
    max-width: 90%;
  }

  .content-wrapper.with-sidebar {
    margin-left: 0;
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
