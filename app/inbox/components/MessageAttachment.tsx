'use client'

interface MessageAttachmentProps {
  mediaUrl: string
  mimeType?: string | null
  fileName?: string | null
  messageType?: string | null
}

export function MessageAttachment({
  mediaUrl,
  mimeType,
  fileName,
  messageType,
}: MessageAttachmentProps) {
  if (!mediaUrl) return null

  const isImage = messageType === 'image' || mimeType?.startsWith('image/')
  const isAudio = messageType === 'audio' || mimeType?.startsWith('audio/')
  const isVideo = messageType === 'video' || mimeType?.startsWith('video/')

  if (isImage) {
    return (
      <div className="message-attachment">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl}
          alt={fileName || 'Image attachment'}
          style={{
            maxWidth: '100%',
            maxHeight: '300px',
            borderRadius: '8px',
            marginTop: '8px',
          }}
        />
        {fileName && (
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            {fileName}
          </div>
        )}
      </div>
    )
  }

  if (isAudio) {
    return (
      <div className="message-attachment">
        <audio controls style={{ width: '100%', marginTop: '8px' }}>
          <source src={mediaUrl} type={mimeType || 'audio/mpeg'} />
          Your browser does not support the audio element.
        </audio>
        {fileName && (
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            {fileName}
          </div>
        )}
      </div>
    )
  }

  if (isVideo) {
    return (
      <div className="message-attachment">
        <video
          controls
          style={{
            maxWidth: '100%',
            maxHeight: '300px',
            borderRadius: '8px',
            marginTop: '8px',
          }}
        >
          <source src={mediaUrl} type={mimeType || 'video/mp4'} />
          Your browser does not support the video element.
        </video>
        {fileName && (
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            {fileName}
          </div>
        )}
      </div>
    )
  }

  // Generic file download
  return (
    <div className="message-attachment">
      <a
        href={mediaUrl}
        download={fileName}
        style={{
          display: 'inline-block',
          padding: '8px 12px',
          background: '#1976d2',
          color: 'white',
          borderRadius: '4px',
          textDecoration: 'none',
          fontSize: '13px',
          marginTop: '8px',
        }}
      >
        📎 Download {fileName || 'attachment'}
      </a>
    </div>
  )
}

