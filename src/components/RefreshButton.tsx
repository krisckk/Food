'use client'

export default function RefreshButton() {
  return (
    <button 
      onClick={() => window.location.reload()}
      className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded"
    >
      刷新狀態
    </button>
  )
}
