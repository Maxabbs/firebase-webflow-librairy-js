// === webflow-url-id-helper.js ===

function getUrlPayloadId() {
  const searchParams = new URLSearchParams(window.location.search);

  // Most common case: https://example.com/page?id=123
  const directId = searchParams.get("id");
  if (directId && directId.trim()) {
    return directId.trim();
  }

  // Fallback: payload can be a JSON string with an `id` field
  const payload = searchParams.get("payload");
  if (!payload) {
    return null;
  }

  try {
    const parsedPayload = JSON.parse(payload);
    if (parsedPayload && parsedPayload.id != null && String(parsedPayload.id).trim()) {
      return String(parsedPayload.id).trim();
    }
  } catch (_) {
    // Ignore parsing errors and continue fallback attempts.
  }

  // Fallback: payload can be base64url encoded JSON
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const decoded = atob(padded);
    const parsedPayload = JSON.parse(decoded);

    if (parsedPayload && parsedPayload.id != null && String(parsedPayload.id).trim()) {
      return String(parsedPayload.id).trim();
    }
  } catch (_) {
    // Ignore parsing errors.
  }

  return null;
}

function requireUrlPayloadId(redirectUrl = "https://getapp.parazar.co/p") {
  const id = getUrlPayloadId();

  if (!id) {
    window.location.replace(redirectUrl);
    return null;
  }

  return id;
}
