import { useState, useEffect, useRef } from 'react'

export function useSessionState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = sessionStorage.getItem(key)
      return item !== null ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error)
      return initialValue
    }
  })

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      if (sessionStorage.getItem(key) === null) {
        return
      }
    }

    try {
      if (state === undefined) {
        sessionStorage.removeItem(key)
      } else {
        sessionStorage.setItem(key, JSON.stringify(state))
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error)
    }
  }, [key, state])

  return [state, setState]
}
