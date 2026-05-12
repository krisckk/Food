'use client'

import { useState, useTransition } from 'react'
import { toggleItemAvailability } from './actions'

type MenuItem = {
  id: string
  name: string
  category: string
  available: boolean
}

export default function AdminMenuClient({ initialItems }: { initialItems: MenuItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (id: string, currentAvailable: boolean) => {
    // Optimistic UI Update: Instantly flip the toggle visually
    setItems((prevItems) => 
      prevItems.map(item => 
        item.id === id ? { ...item, available: !currentAvailable } : item
      )
    )

    // Perform the background server action
    startTransition(async () => {
      try {
        await toggleItemAvailability(id, !currentAvailable)
      } catch {
        // If it fails, revert the state to the original
        alert('Failed to update item availability. Please try again.')
        setItems(initialItems)
      }
    })
  }

  // Group items by category for a cleaner view
  const categories = Array.from(new Set(items.map(i => i.category)))

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen text-gray-900 font-sans">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold">KrisFood Admin</h1>
        <p className="text-gray-500 mt-2">Manage menu item availability instantly.</p>
      </div>
      
      {categories.map(category => (
        <div key={category} className="mb-10">
          <h2 className="text-xl font-bold mb-4 bg-gray-100 p-3 rounded-md">{category}</h2>
          <div className="grid gap-3">
            {items.filter(i => i.category === category).map(item => (
              <label 
                key={item.id} 
                className="flex items-center justify-between p-4 border rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-medium">{item.name}</span>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-semibold ${item.available ? 'text-green-600' : 'text-red-600'}`}>
                    {item.available ? '● Available' : 'Sold Out'}
                  </span>
                  
                  {/* Custom Toggle Switch using Tailwind */}
                  <div className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${item.available ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span 
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${item.available ? 'translate-x-8' : 'translate-x-1'}`} 
                    />
                    <input 
                      type="checkbox"
                      className="sr-only" // hidden screen-reader only input
                      checked={item.available}
                      onChange={() => handleToggle(item.id, item.available)}
                      disabled={isPending}
                    />
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
