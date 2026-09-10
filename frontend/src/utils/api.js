/**
 * Sentinel AI - Production API Client & Safe JSON Parsing Utility
 * 
 * Provides robust URL resolution across environments, safe response parsing
 * that never throws on HTML/non-JSON responses, and multi-endpoint fallback.
 */

/**
 * Resolves the backend API base URL across environments.
 * Priority order:
 * 1. import.meta.env.VITE_API_BASE
 * 2. import.meta.env.VITE_API_URL
 * 3. window.__SENTINEL_API_BASE__
 * 4. Localhost fallback (http://127.0.0.1:8000) for local development
 * 5. Relative empty string if deployed on production behind a reverse proxy
 */
export function getApiBaseUrl() {
  const env =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env
      : {}
  const envBase = env.VITE_API_BASE || env.VITE_API_URL
  if (envBase && typeof envBase === "string" && envBase.trim()) {
    return envBase.trim().replace(/\/+$/, "")
  }

  if (typeof window !== "undefined" && window.__SENTINEL_API_BASE__) {
    return String(window.__SENTINEL_API_BASE__).trim().replace(/\/+$/, "")
  }

  if (typeof window !== "undefined") {
    const { hostname } = window.location
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") {
      return "http://127.0.0.1:8000"
    }
    // In production hosted on remote domain without explicit VITE_API_BASE:
    // Default to relative (for reverse proxies)
    return ""
  }

  return "http://127.0.0.1:8000"
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
        errorMessage = "Authentication service endpoint not found (HTTP 404). Please verify backend API URL."
      } else if (response.status === 405) {
        errorMessage = "Method Not Allowed (HTTP 405). Please verify backend route configuration."
      } else if (response.status === 422) {
        errorMessage = "Invalid request parameters. Please check your inputs."
      } else if (response.status === 502 || response.status === 503 || response.status === 504) {
        errorMessage = `Backend service unavailable (HTTP ${response.status}). Please check that the server is online.`
      } else if (isHtml) {
        errorMessage = `Server returned an HTML error page (HTTP ${response.status}) instead of JSON. The backend service may be offline or misconfigured.`
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
 * Tries candidates to reach backend authentication API.
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
  const base = getApiBaseUrl()

  // Build candidate URLs in priority order
  const candidateUrls = []

  // 1. Explicit base URL if configured
  if (base) {
    candidateUrls.push(`${base}${endpoint}`)
  }

  // 2. Localhost candidates if on local browser
  if (typeof window !== "undefined") {
    const { hostname } = window.location
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      if (!candidateUrls.includes(`http://127.0.0.1:8000${endpoint}`)) {
        candidateUrls.push(`http://127.0.0.1:8000${endpoint}`)
      }
      if (!candidateUrls.includes(`http://localhost:8000${endpoint}`)) {
        candidateUrls.push(`http://localhost:8000${endpoint}`)
      }
    }
  }

  // 3. Relative endpoint (e.g. for reverse proxies / Vite proxy)
  if (!candidateUrls.includes(endpoint)) {
    candidateUrls.push(endpoint)
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
    return {
      ...lastParsedResult,
      ok: false,
      errorMessage:
        lastParsedResult.errorMessage ||
        "Authentication endpoint returned invalid non-JSON response. Please verify backend service URL.",
    }
  }

  // If all candidates failed with network connection errors
  return {
    ok: false,
    status: 0,
    statusText: "Network Error",
    isJson: false,
    isHtml: false,
    data: {},
    rawText: "",
    errorMessage:
      "Unable to connect to Sentinel AI backend service. Please verify that the server is online.",
  }
}
