'use client'

import { useEffect } from 'react'

export default function SyncEngine() {
  useEffect(() => {
    // This function calls the sync API which checks all active orders
    const runGlobalSync = async () => {
      try {
        // We call a special "sync all" mode on the webhook endpoint
        // Or just trigger a general sync check
        await fetch('/api/notion/webhook?all=true')
      } catch (err) {
        // Silent fail
      }
    }

    // Run every 10 seconds to keep Notion database tidy
    const interval = setInterval(runGlobalSync, 10000)
    
    // Also run once immediately on mount
    runGlobalSync()

    return () => clearInterval(interval)
  }, [])

  return null // This component doesn't render anything
}
