import React from 'react'
import '../styles/reactions.css'

const AVAILABLE_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

const ReactionPicker = ({ position, onSelect, onClose }) => {
  const handleEmojiClick = (emoji) => {
    onSelect(emoji)
    onClose()
  }

  const pickerStyle = position ? {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
  } : {}

  return (
    <div className="reaction-picker-overlay" onClick={onClose}>
      <div 
        className="reaction-picker" 
        style={pickerStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {AVAILABLE_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="reaction-emoji-btn"
            onClick={() => handleEmojiClick(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ReactionPicker
