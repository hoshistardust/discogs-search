# Discogs Search

A modern music discovery application built with Vue 3, exploring better search interfaces for the Discogs database.

## Features

- **Universal Search** - Search for releases, artists, and labels
- **Genre Discovery** - Explore music by genres and styles
- **Advanced Filtering** - Filter by format, country, decade, genre, and style
- **Version Explorer** - View different versions of master releases
- **Artist/Label Releases** - Browse releases by specific artists or labels
- **Responsive Design** - Works seamlessly on all devices

## Setup

1. Clone and install dependencies:
```bash
git clone <your-repo-url>
cd discogs-search
npm install
```

2. Create a `.env` file with your Discogs API credentials:
```env
VITE_DISCOGS_CONSUMER_KEY=your_consumer_key
VITE_DISCOGS_CONSUMER_SECRET=your_consumer_secret
```

Get credentials from [Discogs Developer Portal](https://www.discogs.com/settings/developers)

3. Start the development server:
```bash
npm run dev
```

## Tech Stack

- Vue 3 + Vite
- Vue Router
- Discogs API
- Material Symbols Icons

## License

ISC
