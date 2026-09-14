// Keep the same operation through network/provider failures. A successful action
// clears it, so a new booking with identical details still gets a new UUID.
window.PPATEmailOperations = (() => {
  const memory = new Map();
  async function headers(scope, payload) {
    const { marketing_attribution, ...data } = payload;
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(data)));
    const fingerprint = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
    const storageKey = `ppat-email-operation:${scope}`;
    let operation = memory.get(scope);
    if (!operation) {
      try { operation = JSON.parse(sessionStorage.getItem(storageKey)); } catch { /* Storage can be unavailable. */ }
    }
    if (!operation || operation.fingerprint !== fingerprint || Date.now() - operation.createdAt >= 23 * 60 * 60_000) {
      operation = { id: crypto.randomUUID(), fingerprint, createdAt: Date.now() };
    }
    memory.set(scope, operation);
    try { sessionStorage.setItem(storageKey, JSON.stringify(operation)); } catch { /* In-memory fallback. */ }
    return { "Idempotency-Key": operation.id };
  }
  function complete(scope) {
    memory.delete(scope);
    try { sessionStorage.removeItem(`ppat-email-operation:${scope}`); } catch { /* In-memory fallback. */ }
  }
  return { headers, complete };
})();
