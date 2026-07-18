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

  return (
    <div
      className="base64-content my-4 block border-l-2 border-tertiary pl-4 text-body-lg"
      dangerouslySetInnerHTML={{ __html: content || 'Decoding...' }}
    />
  )
}

export { Base64Decoder as default }
