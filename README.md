# Discogs Top 5 Albums

A Vue 3 application that displays the top 5 albums from Discogs using their REST API with key/secret authentication.

## Features

- 🎵 Display top 5 albums from Discogs
- 🔐 Secure authentication using Consumer Key and Secret (stored in .env file)
- 🔍 Search functionality to find different albums
- 📱 Responsive design
- ⚡ Fast loading with Vue 3 and Vite

## Prerequisites

Before running this application, you need to obtain Discogs API credentials:

1. Go to [Discogs Developer Settings](https://www.discogs.com/settings/developers)
2. Create a new application
3. Copy your Consumer Key and Consumer Secret

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd discogs-search
```

2. Install dependencies:
```bash
npm install
```

3. Configure API credentials:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your Discogs API credentials:
     ```
     VITE_DISCOGS_CONSUMER_KEY=your_actual_consumer_key_here
     VITE_DISCOGS_CONSUMER_SECRET=your_actual_consumer_secret_here
     ```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. The application automatically loads and displays the top 5 Beatles albums when you first visit
2. Use the search bar to find different artists or albums
3. Results are displayed in an elegant card-based layout with album art, details, and community stats

## API Authentication

This application uses the Discogs API key/secret authentication method as documented here:
https://www.discogs.com/developers#page:authentication

The credentials are stored in environment variables and appended to API requests as query parameters:
- `key`: Your consumer key (from `VITE_DISCOGS_CONSUMER_KEY`)
- `secret`: Your consumer secret (from `VITE_DISCOGS_CONSUMER_SECRET`)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
discogs-search/
├── index.html              # Main HTML file
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (gitignored)
├── .env.example           # Example environment file
├── src/
│   ├── main.js           # Vue app entry point
│   ├── App.vue           # Main component with albums display
│   └── services/
│       └── discogs.js    # Discogs API integration
└── README.md             # This file
```

## Tech Stack

- Vue 3 - Progressive JavaScript framework
- Vite - Fast build tool and dev server
- Discogs API - Music database API

## Security Note

API credentials are stored in a `.env` file which is excluded from version control via `.gitignore`.

**Important**: Never commit your `.env` file to version control. The `.env.example` file is provided as a template for other developers.

For production deployments, set the environment variables in your hosting platform's configuration.

## License

ISC
