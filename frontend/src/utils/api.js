/**
 * Sentinel AI - Production API Client & Safe JSON Parsing Utility
 * 
 * Provides robust URL resolution across environments, safe response parsing
 * that never throws on HTML/non-JSON responses, and multi-endpoint fallback.
 */

/**
 * Determines whether the current execution context is a local development environment.
 * Evaluates window.location.hostname against standard loopback identifiers.
 *
 * @returns {boolean}
 */
export function isLocalEnvironment() {
  if (typeof window === "undefined" || !window.location) {
    return true
  }
  const { hostname } = window.location
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local")
  )
}

/**
 * Checks whether a given URL points to a loopback/development address.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isLoopbackUrl(url) {
  if (!url || typeof url !== "string") return false
  const lower = url.trim().toLowerCase()
  return (
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.includes("0.0.0.0") ||
    lower.includes("[::1]") ||
    lower.includes("::1")
  )
}

/**
 * Resolves the backend API base URL across environments.
 * 
 * In Production (e.g. deployed on Vercel or any remote domain):
 * - Reads VITE_API_BASE or VITE_API_URL or window.__SENTINEL_API_BASE__
 * - Strictly DISCARDS any localhost / 127.0.0.1 value to prevent production connection errors
 * - Defaults to empty string "" (relative path) if no remote URL is configured
 *
 * In Local Development:
 * - Uses configured VITE_API_BASE / VITE_API_URL, or falls back to http://127.0.0.1:8000
 *
 * @returns {string}
 */
export function getApiBaseUrl() {
  const isLocal = isLocalEnvironment()

  const env =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env
      : {}

  // 1. Check Vite build-time environment variables
  const envBase = (env.VITE_API_BASE || env.VITE_API_URL || "").trim()

  // 2. Check runtime window override or localStorage override (useful for testing/dynamic config)
  let runtimeOverride = ""
  if (typeof window !== "undefined") {
    if (window.__SENTINEL_API_BASE__) {
      runtimeOverride = String(window.__SENTINEL_API_BASE__).trim()
    } else {
      try {
        const stored = window.localStorage?.getItem("sentinel_api_base")
        if (stored) runtimeOverride = stored.trim()
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  const candidateBase = runtimeOverride || envBase

  if (candidateBase) {
    // If running in production on a remote domain (like Vercel):
    if (!isLocal) {
      if (isLoopbackUrl(candidateBase)) {
        console.warn(
          `[Sentinel AI] Discarding local development URL "${candidateBase}" on production host (${window.location.hostname}). Using production API resolution.`
        )
      } else {
        // Valid remote production URL
        return candidateBase.replace(/\/+$/, "")
      }
    } else {
      // Local development can use candidateBase directly
      return candidateBase.replace(/\/+$/, "")
    }
  }

  // Fallbacks:
  if (isLocal) {
    return "http://127.0.0.1:8000"
  }

  // Production with no explicit remote URL defaults to same-origin relative (for reverse proxies / CDN rewrites)
  return ""
}

/**
 * Safely extracts JSON data or formatted error details from an HTTP response
 * WITHOUT blindly calling response.json(), preventing SyntaxError when HTML/plain text is returned.
 *
 * @param {Response} response - The fetch Response object
 * @returns {Promise<{
 *   ok: boolean,
 *   status: number,
 *   statusText: string,
 *   isJson: boolean,
 *   isHtml: boolean,
 *   data: Record<string, any>,
 *   rawText: string,
 *   errorMessage: string | null
 * }>}
 */
export async function safeParseResponse(response) {
  if (!response) {
    return {
      ok: false,
      status: 0,
      statusText: "No Response",
      isJson: false,
      isHtml: false,
      data: {},
      rawText: "",
      errorMessage: "No response received from server.",
    }
  }

  const contentType = (response.headers?.get("content-type") || "").toLowerCase()
  const isJsonHeader = contentType.includes("application/json")

  let rawText = ""
  let data = null
  let isJson = false

  try {
    rawText = await response.text()
    if (rawText && rawText.trim()) {
      try {
        data = JSON.parse(rawText)
        isJson = true
      } catch {
        data = null
        isJson = false
      }
    }
  } catch {
    rawText = ""
    data = null
    isJson = false
  }

  // Detect HTML responses (e.g. from static host 404/502/503 page or SPA index.html fallback)
  const isHtml =
    contentType.includes("text/html") ||
    /^\s*<!doctype|^\s*<html|^\s*<head|^\s*<body|The page cannot|The page could not/i.test(rawText)

  let errorMessage = null

  if (!response.ok) {
    // 1. Try extracting structured error from JSON
    if (isJson && data && typeof data === "object") {
      if (typeof data.detail === "string") {
        errorMessage = data.detail
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail
          .map((item) => item.msg || item.message || JSON.stringify(item))
          .join("; ")
      } else if (typeof data.message === "string") {
        errorMessage = data.message
      } else if (typeof data.error === "string") {
        errorMessage = data.error
      }
    }

    // 2. If no structured error, generate human-readable status message
    if (!errorMessage) {
      if (response.status === 401) {
        errorMessage = "Invalid email or password. Please try again."
      } else if (response.status === 403) {
        errorMessage = "Access forbidden. User account may be inactive or disabled."
      } else if (response.status === 404) {
        if (!isLocalEnvironment()) {
          errorMessage =
            "Authentication service endpoint not found (HTTP 404). Please verify backend deployment and VITE_API_BASE configuration."
        } else {
          errorMessage =
            "Authentication service endpoint not found (HTTP 404). Please verify that the FastAPI backend is running on port 8000."
        }
      } else if (response.status === 405) {
        if (!isLocalEnvironment()) {
          errorMessage =
            "Method Not Allowed (HTTP 405). The request reached a static host or an endpoint not accepting POST. Please verify your backend API URL in VITE_API_BASE."
        } else {
          errorMessage =
            "Method Not Allowed (HTTP 405). Authentication endpoint requires HTTP POST with valid JSON credentials."
        }
      } else if (response.status === 422) {
        errorMessage = "Invalid request parameters. Please check your inputs."
      } else if (response.status === 502 || response.status === 503 || response.status === 504) {
        errorMessage = `Backend service unavailable (HTTP ${response.status}). Please check that the server is online.`
      } else if (isHtml) {
        errorMessage = `Server returned an HTML response (HTTP ${response.status}) instead of JSON. The backend service may be offline or misconfigured.`
      } else if (rawText && rawText.length < 120 && !rawText.includes("<")) {
        errorMessage = rawText.trim()
      } else {
        errorMessage = `Server error (HTTP ${response.status} ${response.statusText || ""}).`
      }
    }
  } else if (!isJson) {
    // 200 OK but returned HTML or non-JSON (e.g. static server fallback to index.html)
    errorMessage = "Received HTML instead of JSON from authentication API. Please verify the backend endpoint URL."
  }

  return {
    ok: response.ok && isJson,
    status: response.status,
    statusText: response.statusText,
    isJson,
    isHtml,
    data: data || {},
    rawText,
    errorMessage,
  }
}

/**
 * Dispatches an authentication request with fallback candidates.
 * In production (e.g. Vercel), strictly avoids localhost/127.0.0.1.
 * Skips non-JSON / HTML responses (e.g. from static dev server or SPA 404 catch-alls).
 *
 * @param {string} endpoint - The relative endpoint path (e.g. "/api/auth/login")
 * @param {Record<string, any>} payload - The request body
 * @returns {Promise<{
 *   ok: boolean,
 *   status: number,
 *   statusText: string,
 *   isJson: boolean,
 *   isHtml: boolean,
 *   data: Record<string, any>,
 *   rawText: string,
 *   errorMessage: string | null
 * }>}
 */
export async function postAuthWithFallback(endpoint, payload) {
  const isLocal = isLocalEnvironment()
  const base = getApiBaseUrl()
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  // Build candidate URLs in priority order
  const candidateUrls = []

  // 1. Explicit base URL if configured (remote production URL or local dev base)
  if (base) {
    const fullUrl = `${base}${cleanEndpoint}`
    if (!isLocal && isLoopbackUrl(fullUrl)) {
      // NEVER allow loopback URLs in production candidate list
    } else {
      candidateUrls.push(fullUrl)
    }
  }

  // 2. Localhost candidates ONLY if running in local browser environment
  if (isLocal) {
    const local127 = `http://127.0.0.1:8000${cleanEndpoint}`
    const localHost = `http://localhost:8000${cleanEndpoint}`
    if (!candidateUrls.includes(local127)) candidateUrls.push(local127)
    if (!candidateUrls.includes(localHost)) candidateUrls.push(localHost)
  }

  // 3. Relative endpoint (for reverse proxies, Vercel rewrites, or Vite dev proxy)
  if (!candidateUrls.includes(cleanEndpoint)) {
    candidateUrls.push(cleanEndpoint)
  }

  let lastParsedResult = null

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const parsed = await safeParseResponse(res)

      // If the candidate returned valid JSON (whether success or 400/401/403/422 error),
      // this candidate IS the actual API server! Return it immediately.
      if (parsed.isJson) {
        return parsed
      }

      // If it returned HTML or non-JSON (like 404 "The page cannot be found"),
      // record it but continue trying the other candidates.
      lastParsedResult = parsed
    } catch {
      // Network failure on this candidate, continue to next
    }
  }

  // If a non-JSON/HTML response was received from all candidates
  if (lastParsedResult) {
    let msg = lastParsedResult.errorMessage || null
    if (!msg || lastParsedResult.status === 404 || lastParsedResult.status === 405) {
      if (lastParsedResult.status === 405) {
        msg = !isLocal
          ? "Method Not Allowed (HTTP 405). The request reached a static host or an endpoint not accepting POST. Please configure VITE_API_BASE in Vercel to point to your FastAPI backend."
          : "Method Not Allowed (HTTP 405). Authentication endpoint requires HTTP POST with valid JSON credentials."
      } else if (!isLocal) {
        msg =
          "Authentication service endpoint not found (HTTP 404). Please verify backend API URL and configure VITE_API_BASE on Vercel."
      } else {
        msg =
          "Authentication service endpoint not found (HTTP 404). Please verify that the FastAPI backend is running on port 8000."
      }
    }
    return {
      ...lastParsedResult,
      ok: false,
      errorMessage: msg,
    }
  }

  // If all candidates failed with network connection errors
  const networkErrMsg = !isLocal
    ? "Unable to connect to Sentinel AI production backend. Please verify your internet connection and backend deployment."
    : "Unable to connect to Sentinel AI backend service. Please verify that the server is running on http://127.0.0.1:8000."

  return {
    ok: false,
    status: 0,
    statusText: "Network Error",
    isJson: false,
    isHtml: false,
    data: {},
    rawText: "",
    errorMessage: networkErrMsg,
  }
}

