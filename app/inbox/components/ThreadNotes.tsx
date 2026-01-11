'use client'

import { useState, useEffect } from 'react'

interface Note {
  id: string
  note: string
  created_at: string
  created_by: string | null
}

interface ThreadNotesProps {
  threadId: string
}

export function ThreadNotes({ threadId }: ThreadNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/threads/${threadId}/notes`)
      const data = await response.json()
      if (response.ok) {
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }

  useEffect(() => {
    if (threadId) {
      fetchNotes()
    }
  }, [threadId])

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/threads/${threadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      })

      if (response.ok) {
        setNewNote('')
        fetchNotes()
      } else {
        alert('Failed to add note')
      }
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Failed to add note')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="thread-notes">
      <h4>Internal Notes</h4>
      <div className="notes-list">
        {notes.map((note) => (
          <div key={note.id} className="note-item">
            <div className="note-text">{note.note}</div>
            <div className="note-time">
              {new Date(note.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <div className="note-input">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add internal note..."
          rows={3}
          className="note-textarea"
        />
        <button
          onClick={handleAddNote}
          disabled={!newNote.trim() || loading}
          className="note-button"
        >
          Add Note
        </button>
      </div>
    </div>
  )
}

