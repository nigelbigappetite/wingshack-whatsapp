'use client'

import { useState, useEffect, useCallback } from 'react'

interface Tag {
  id: string
  name: string
  color: string | null
}

interface ThreadTagsProps {
  threadId: string
}

export function ThreadTags({ threadId }: ThreadTagsProps) {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [threadTags, setThreadTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags')
      const data = await response.json()
      if (response.ok) {
        setAllTags(data.tags || [])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }, [])

  const fetchThreadTags = useCallback(async () => {
    try {
      // For now, we'll fetch thread tags by querying thread_tags table
      // In a real implementation, you'd have a dedicated endpoint
      const response = await fetch(`/api/threads/${threadId}/tags`)
      if (response.ok) {
        const data = await response.json()
        setThreadTags(data.tags?.map((t: any) => t.tag_id) || [])
      }
    } catch (error) {
      console.error('Error fetching thread tags:', error)
    }
  }, [threadId])

  useEffect(() => {
    if (threadId) {
      fetchTags()
      fetchThreadTags()
    }
  }, [threadId, fetchTags, fetchThreadTags])

  const handleAddTag = async (tagId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/threads/${threadId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_id: tagId }),
      })

      if (response.ok) {
        fetchThreadTags()
      }
    } catch (error) {
      console.error('Error adding tag:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/threads/${threadId}/tags?tag_id=${tagId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchThreadTags()
      }
    } catch (error) {
      console.error('Error removing tag:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="thread-tags">
      <h4>Tags</h4>
      <div className="tags-list">
        {threadTags.map((tagId) => {
          const tag = allTags.find((t) => t.id === tagId)
          if (!tag) return null
          return (
            <span
              key={tag.id}
              className="tag-badge"
              style={{
                backgroundColor: tag.color || '#1976d2',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                marginRight: '8px',
                marginBottom: '8px',
                display: 'inline-block',
                cursor: 'pointer',
              }}
              onClick={() => handleRemoveTag(tag.id)}
            >
              {tag.name} ×
            </span>
          )
        })}
      </div>
      <div className="tag-picker">
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleAddTag(e.target.value)
              e.target.value = ''
            }
          }}
          disabled={loading}
          className="tag-select"
        >
          <option value="">Add tag...</option>
          {allTags
            .filter((tag) => !threadTags.includes(tag.id))
            .map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
        </select>
      </div>
    </div>
  )
}

