
const VITE_GOOGLE_CLIENT_ID    = import.meta.env.VITE_GOOGLE_CLIENT_ID    || "";
const VITE_MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || "";
const VITE_OAUTH_REDIRECT_URI  = import.meta.env.VITE_OAUTH_REDIRECT_URI
  || `${window.location.origin}/oauth2/callback`;

// ── Crypto helpers ─────────────────────────────────────────────────────────
function generateNonce(len = 32) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

async function generatePKCE() {
  const verifier = generateNonce(48);
  const encoder  = new TextEncoder();
  const data     = encoder.encode(verifier);
  const hash     = await crypto.subtle.digest("SHA-256", data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return { verifier, challenge };
}

// ── State builder (base64 JSON passed through OAuth round-trip) ────────────
function buildState(provider, extra = {}) {
  const nonce = generateNonce(16);
  sessionStorage.setItem("oauth_nonce", nonce);
  const state = { provider, nonce, redirectTo: extra.redirectTo || null };
  return btoa(JSON.stringify(state));
}

// ── Google ─────────────────────────────────────────────────────────────────
export async function loginWithGoogle({ redirectTo } = {}) {
  if (!VITE_GOOGLE_CLIENT_ID) {
    console.error("Missing VITE_GOOGLE_CLIENT_ID in .env");
    return;
  }

  const { verifier, challenge } = await generatePKCE();
  sessionStorage.setItem("pkce_verifier", verifier);

  const params = new URLSearchParams({
    client_id:             VITE_GOOGLE_CLIENT_ID,
    redirect_uri:          VITE_OAUTH_REDIRECT_URI,
    response_type:         "code",
    scope:                 "openid email profile",
    access_type:           "offline",
    prompt:                "select_account",
    state:                 buildState("google", { redirectTo }),
    code_challenge:        challenge,
    code_challenge_method: "S256",
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// ── Microsoft ──────────────────────────────────────────────────────────────
export async function loginWithMicrosoft({ redirectTo, tenant = "common" } = {}) {
  if (!VITE_MICROSOFT_CLIENT_ID) {
    console.error("Missing VITE_MICROSOFT_CLIENT_ID in .env");
    return;
  }

  const { verifier, challenge } = await generatePKCE();
  sessionStorage.setItem("pkce_verifier", verifier);

  const params = new URLSearchParams({
    client_id:             VITE_MICROSOFT_CLIENT_ID,
    redirect_uri:          VITE_OAUTH_REDIRECT_URI,
    response_type:         "code",
    scope:                 "openid email profile offline_access",
    response_mode:         "query",
    prompt:                "select_account",
    state:                 buildState("microsoft", { redirectTo }),
    code_challenge:        challenge,
    code_challenge_method: "S256",
  });

  window.location.href = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`;
}

// ── Hook (convenience wrapper) ─────────────────────────────────────────────
export function useOAuth2() {
  return { loginWithGoogle, loginWithMicrosoft };
}

export default useOAuth2;