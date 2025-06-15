'use client'

import { useEffect, useState } from 'react'

const Base64Decoder = ({ encodedString }) => {
  const [content, setContent] = useState('')

  useEffect(() => {
    try {
      const decoded = window.atob(encodedString)
      setContent(decoded)
    } catch (e) {
      console.error('Base64 decoding error:', e)
      setContent('Unable to decode content')
    }
  }, [encodedString])

  // Use a styled div to ensure visibility
  return (
    <div
      className="base64-content"
      dangerouslySetInnerHTML={{ __html: content || 'Decoding...' }}
      style={{ display: 'block', margin: '1em 0' }}
    />
  )
}

export { Base64Decoder as default }
