import { useEffect, useState } from 'react'
import type { Observable } from 'rxjs'

/**
 * Subscribe to an RxJS observable (e.g. RxDB `query.$`) and return the latest value.
 * Unsubscribes on unmount or when `source` changes.
 */
export function useRxQuery<T>(source: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    const sub = source.subscribe({
      next: (v) => setValue(v),
    })
    return () => sub.unsubscribe()
  }, [source])

  return value
}
