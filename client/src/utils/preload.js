// In production the server puts the data a page asks for on start-up inside index.html, as a JSON block
// (server/services/seo.service.js, "data sent along with the page"). Reading it here lets the first screen
// draw straight away instead of waiting for API calls. In development there is no such block and everything
// comes from the API as before.
const preloaded = (() => {
  try {
    const element = document.getElementById('nidan-preload');
    return element ? JSON.parse(element.textContent) : {};
  } catch {
    return {};
  }
})();

/** The embedded API response for `key` (for example '/public/home'), or undefined. Each one can be taken once. */
export function takePreloaded(key) {
  const value = preloaded[key];
  delete preloaded[key];
  return value;
}
