import { QueryClient } from "@tanstack/react-query"

/** Single shared query client. Retries kept low (1) so a genuinely broken
 *  request surfaces to the user quickly instead of silently retrying for
 *  several seconds -- the app's own retry-affordances (buttons) cover the
 *  "try again" case explicitly instead. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
