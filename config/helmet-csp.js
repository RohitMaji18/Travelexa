// This is your final, corrected CSP configuration file.

const cspDirectives = {
  directives: {
    // Default and Base Policies
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],

    // Security Policies
    blockAllMixedContent: [],
    upgradeInsecureRequests: [],
    frameAncestors: ["'self'"],
    objectSrc: ["'none'"],
    scriptSrcAttr: ["'none'"],

    // Asset Sources (Combined)
    fontSrc: ["'self'", 'https:', 'data:', 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'blob:', 'data:', 'https://*.tile.openstreetmap.org'],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      'https:',
      'https://unpkg.com',
      'https://fonts.googleapis.com',
      'https://unpkg.com/leaflet/dist/',
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/'
    ],

    // Scripting and Connection Policies (Combined)
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'https://js.stripe.com',
      'https://cdnjs.cloudflare.com',
      'https://unpkg.com',
      'blob:'
    ],
    scriptSrcElem: [
      "'self'",
      "'unsafe-inline'",
      'https://js.stripe.com',
      'https://cdnjs.cloudflare.com',
      'https://unpkg.com',
      'blob:'
    ],
    connectSrc: [
      "'self'", // This correctly allows API calls to your own server
      // REMOVED: '/api/v1/ai/itinerary-stream' (This was an invalid path)
      'https://*.stripe.com',
      'https://*.tile.openstreetmap.org',
      'ws://127.0.0.1:*', // Allows WebSocket connections for live reload
      'ws://localhost:*' // Also for live reload
    ],

    // Worker and Frame Policies
    workerSrc: ["'self'", 'blob:'],
    frameSrc: ["'self'", 'https://js.stripe.com']
  }
};

module.exports = cspDirectives;
