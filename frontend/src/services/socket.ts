import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io('http://localhost:3000', {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      console.log('🔌 Connected to server')
    })

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server')
    })

    socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error)
    })
  }

  return socket
}

export function connectSocket() {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
  }
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect()
  }
}

export function joinShop(shopId: string) {
  const s = getSocket()
  if (s.connected) {
    s.emit('join-shop', shopId)
    console.log('📤 Emitted join-shop:', shopId)
  } else {
    s.once('connect', () => {
      s.emit('join-shop', shopId)
      console.log('📤 Emitted join-shop after connect:', shopId)
    })
  }
}

export function joinCustomer(userId: string) {
  const s = getSocket()
  if (s.connected) {
    s.emit('join-customer', userId)
    console.log('📤 Emitted join-customer:', userId)
  } else {
    s.once('connect', () => {
      s.emit('join-customer', userId)
      console.log('📤 Emitted join-customer after connect:', userId)
    })
  }
}

export function joinCourier(courierId: string) {
  const s = getSocket()
  if (s.connected) {
    s.emit('join-courier', courierId)
    console.log('📤 Emitted join-courier:', courierId)
  } else {
    s.once('connect', () => {
      s.emit('join-courier', courierId)
      console.log('📤 Emitted join-courier after connect:', courierId)
    })
  }
}
