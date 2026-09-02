import { useEffect, useState } from "react"

/** Returns `value`, updated only after it's stopped changing for `delayMs`.
 *  Small standalone hook so any live-search input can debounce its query
 *  key before handing it to useQuery, instead of each call site rolling
 *  its own setTimeout/clearTimeout dance. */
export function useDebouncedValue(value, delayMs = 200) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(handle)
  }, [value, delayMs])

  return debounced
}
