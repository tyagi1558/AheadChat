import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// Create a socket connection
export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

// Setup Socket.IO client
export const setupSocket = (userId) => {
  if (socket.connected) {
    socket.disconnect();
  }
  
  socket.connect();
  
  if (userId) {
    socket.emit('setup', userId);
  }
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;