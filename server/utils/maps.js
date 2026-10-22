// Google Maps links that need no API key: one opens the place in Maps, one is the embeddable view.
const mapsSearchUrl = (query) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
const mapsEmbedUrl = (query) => `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

/** "Name, address, city, state, pin" as one search string. */
const locationQuery = ({ name, address, city, state, postalCode }) => [name, address, city, state, postalCode].filter(Boolean).join(', ');

module.exports = { mapsSearchUrl, mapsEmbedUrl, locationQuery };
