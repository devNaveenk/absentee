import axios from "axios"

export const api = axios.create({ baseURL: "/api" })

const connectivityListeners = new Set()

/** Subscribe to "the backend is unreachable" events -- either no HTTP response at all
 *  (DNS/connection failure, backend process down) or a reverse-proxy gateway error
 *  (502/503/504, i.e. nginx is up but the app server behind it isn't) -- distinct from
 *  ordinary 4xx/5xx application errors, which individual pages already handle with their
 *  own retry banners. */
export function onConnectivityLost(listener) {
  connectivityListeners.add(listener)
  return () => connectivityListeners.delete(listener)
}

const GATEWAY_ERROR_STATUSES = new Set([502, 503, 504])

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ballotda_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("ballotda_token")
      localStorage.removeItem("ballotda_session")
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    } else if (!error.response || GATEWAY_ERROR_STATUSES.has(error.response.status)) {
      // Either no response reached us at all, or the reverse proxy answered on the app
      // server's behalf -- both mean the API itself is down, not just returning an error.
      connectivityListeners.forEach((listener) => listener())
    }
    return Promise.reject(error)
  }
)
