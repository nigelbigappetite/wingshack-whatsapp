'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function ThreadSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Update URL when debounced term changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (debouncedTerm) {
      params.set('q', debouncedTerm)
    } else {
      params.delete('q')
    }
    router.push(`/inbox?${params.toString()}`, { scroll: false })
  }, [debouncedTerm, router, searchParams])

  return (
    <div className="thread-search">
      <input
        type="text"
        placeholder="Search by phone or message content..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
    </div>
  )
}

