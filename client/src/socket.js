import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const setupSocket = (userId) => {
  if (socket.connected) {
    socket.disconnect();
  }

  socket.connect();

  if (userId) {
    socket.emit("setup", userId);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
