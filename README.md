# Discogs Top Charts 2025

A modern, responsive web application showcasing the top albums and artists of 2025, ranked by community engagement. Built with Vue 3 and Vite.

## Features

- 📀 **Top Albums of 2025** - Displays the top 5 albums ranked by community engagement from Discogs API
- 🎤 **Top Artists of 2025** - Shows the most engaged artists of the year from Discogs API
- 🔍 **Search Bar** - UI ready (functionality coming soon)
- 📱 **Responsive Design** - Works beautifully on desktop and mobile devices
- ✨ **Figma Design** - Pixel-perfect implementation matching Figma design specifications
- 🎨 **Discogs Branding** - Official Discogs logo and styling

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next-generation frontend tooling
- **Discogs API** - Music database and marketplace (integration ready)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd discogs-search
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
discogs-search/
├── index.html              # Main HTML file
├── src/
│   ├── App.vue            # Main app wrapper with header
│   ├── main.js            # Application entry point
│   ├── router/
│   │   └── index.js       # Vue Router configuration
│   ├── views/
│   │   ├── Home.vue       # Home page with centered search
│   │   └── SearchResults.vue  # Search results page
│   └── services/
│       └── discogs.js     # Discogs API service
├── package.json
└── README.md
```

## Current Implementation

### Home Page (/)
- Centered search interface
- Clean, minimalist design
- Search bar (794x44px, rounded corners)
- Redirects to `/results?q=search+term` on search

### Search Results Page (/results)
- Separate sections for **Releases** and **Artists**
- Displays top 10 results for each category
- Rectangular cards (240x240px) for releases
- Circular images (240x240px) for artists
- Shows version count for master releases
- Includes Discogs detail page links
- "Show All" buttons for each section (future implementation)
- Horizontal scrolling layout matching Figma design

### Design Implementation
- Fixed black header bar with clickable Discogs logo (links to home)
- White background
- Inria Sans font family
- Exact spacing and positioning from Figma design
- Fully responsive design

### Search Functionality
- Universal search for artists and master releases via Discogs API
- Real-time search with URL-based queries
- Displays version counts for master releases
- Direct links to Discogs detail pages
- Filters results to show only artists and master releases

## Future Enhancements

- [x] Connect search bar to Discogs API
- [ ] Implement "Show All" functionality for releases and artists
- [ ] Add filtering options (genre, year, format)
- [ ] Implement pagination for more results
- [ ] Add album/artist detail pages
- [ ] User authentication and favorites
- [ ] Dark mode toggle

## API Integration

The app includes a Discogs API service layer (`src/services/discogs.js`) ready for integration. To enable API features:

1. Create a `.env` file in the project root:
```env
VITE_DISCOGS_CONSUMER_KEY=your_consumer_key
VITE_DISCOGS_CONSUMER_SECRET=your_consumer_secret
```

2. Get your API credentials from [Discogs Developer Portal](https://www.discogs.com/settings/developers)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

ISC
