const WS_URL = 'ws://localhost:8000/api/ws'

export class WebSocketService {
  constructor(token) {
    this.token = token
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.messageHandlers = []
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${WS_URL}?token=${this.token}`)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          resolve(this.ws)
        }

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data)
          this.messageHandlers.forEach((handler) => handler(data))
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.attemptReconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`)
      setTimeout(() => this.connect(), 3000)
    }
  }

  onMessage(handler) {
    // Clear existing handlers to prevent duplicates
    this.messageHandlers = [handler]
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  sendMessage(content, roomId = null, receiverId = null, fileUrl = null, fileName = null, fileType = null, attachments = [], replyToMessageId = null) {
    this.send({
      type: 'chat_message',
      content,
      room_id: roomId,
      receiver_id: receiverId,
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType,
      attachments: attachments,
      reply_to_message_id: replyToMessageId,
    })
  }

  joinRoom(roomId) {
    this.send({
      type: 'join_room',
      room_id: roomId,
    })
  }

  leaveRoom(roomId) {
    this.send({
      type: 'leave_room',
      room_id: roomId,
    })
  }

  sendTyping(isTyping, roomId = null, receiverId = null) {
    this.send({
      type: 'typing',
      is_typing: isTyping,
      room_id: roomId,
      receiver_id: receiverId,
    })
  }

  markAsRead(messageIds) {
    this.send({
      type: 'mark_as_read',
      message_ids: messageIds,
    })
  }

  editMessage(messageId, newContent) {
    this.send({
      type: 'edit_message',
      message_id: messageId,
      content: newContent,
    })
  }

  deleteMessage(messageId, deleteForEveryone = false) {
    this.send({
      type: 'delete_message',
      message_id: messageId,
      delete_for_everyone: deleteForEveryone,
    })
  }

  pinMessage(messageId) {
    this.send({
      type: 'pin_message',
      message_id: messageId,
    })
  }

  unpinMessage(messageId) {
    this.send({
      type: 'unpin_message',
      message_id: messageId,
    })
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
