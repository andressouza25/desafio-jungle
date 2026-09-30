/* global self, importScripts, URL */
// Keep the generated MSW worker unchanged. Only the REST API needs mocking;
// local images/audio (including range streams) must not retain transferred
// response-body clones in MSW's client lifecycle events.
self.addEventListener('fetch', (event) => {
  if (!new URL(event.request.url).pathname.startsWith('/api/')) event.stopImmediatePropagation()
})
importScripts('./mockServiceWorker.js')
