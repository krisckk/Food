'use client'

import { useEffect, useRef } from 'react'

export default function SyncEngine() {
  const isSyncing = useRef(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const runGlobalSync = async () => {
      if (isSyncing.current) return
      
      isSyncing.current = true
      try {
        await fetch('/api/notion/webhook?all=true')
      } catch {
        // Silent fail
      } finally {
        isSyncing.current = false
        // Aggressive polling: run again 3 seconds AFTER the last request finishes
        timeoutId = setTimeout(runGlobalSync, 3000)
      }
    }

    // Start the engine
    runGlobalSync()

    return () => clearTimeout(timeoutId)
  }, [])

  return null // This component doesn't render anything
}
