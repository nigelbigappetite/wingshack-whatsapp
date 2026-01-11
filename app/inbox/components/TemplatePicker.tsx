'use client'

import { useState, useEffect, useCallback } from 'react'
import { renderTemplate } from '@/src/lib/templateRenderer'

interface Template {
  id: string
  title: string
  body: string
  category: string | null
}

interface TemplatePickerProps {
  threadId: string
  onSelect: (renderedText: string) => void
}

export function TemplatePicker({ threadId, onSelect }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [preview, setPreview] = useState<string>('')

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      const data = await response.json()
      if (response.ok) {
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const renderPreview = useCallback(async () => {
    if (!selectedTemplateId || !threadId) return

    try {
      const response = await fetch(`/api/templates/${selectedTemplateId}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: threadId }),
      })

      if (response.ok) {
        const data = await response.json()
        setPreview(data.rendered)
      }
    } catch (error) {
      console.error('Error rendering template:', error)
    }
  }, [selectedTemplateId, threadId])

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (selectedTemplateId && threadId) {
      renderPreview()
    }
  }, [selectedTemplateId, threadId, renderPreview])

  const handleUseTemplate = () => {
    if (preview) {
      onSelect(preview)
      setSelectedTemplateId('')
      setPreview('')
    }
  }

  if (templates.length === 0) return null

  return (
    <div className="template-picker">
      <select
        value={selectedTemplateId}
        onChange={(e) => setSelectedTemplateId(e.target.value)}
        className="template-select"
      >
        <option value="">Select template...</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.title}
          </option>
        ))}
      </select>
      {preview && (
        <div className="template-preview">
          <div className="preview-text">{preview}</div>
          <button onClick={handleUseTemplate} className="use-template-button">
            Use Template
          </button>
        </div>
      )}
    </div>
  )
}

