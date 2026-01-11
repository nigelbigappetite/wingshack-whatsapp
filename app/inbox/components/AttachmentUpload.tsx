'use client'

import { useState } from 'react'

interface AttachmentUploadProps {
  onFileSelect: (file: File) => void
  onRemove: () => void
  selectedFile: File | null
}

export function AttachmentUpload({
  onFileSelect,
  onRemove,
  selectedFile,
}: AttachmentUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Only allow images for now
      if (file.type.startsWith('image/')) {
        onFileSelect(file)
      } else {
        alert('Only image files are supported')
      }
    }
  }

  return (
    <div className="attachment-upload">
      {selectedFile ? (
        <div className="attachment-preview">
          <span>{selectedFile.name}</span>
          <button type="button" onClick={onRemove} className="remove-attachment">
            ×
          </button>
        </div>
      ) : (
        <label className="attachment-label">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          📎 Attach Image
        </label>
      )}
    </div>
  )
}

