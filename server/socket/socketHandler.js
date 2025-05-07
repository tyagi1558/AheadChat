const User = require('../models/User');

const setupSocketIO = (io) => {
  // Map to store user socket connections
  const userSockets = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);

    // Handle user joining
    socket.on('setup', async (userId) => {
      // Store user socket mapping
      userSockets.set(userId, socket.id);
      socket.userId = userId;

      // Update user status to online
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        // Broadcast to all connected clients that this user is online
        io.emit('user_status', { userId, isOnline: true });
      } catch (error) {
        console.error('Error updating user status:', error);
      }

      // Join a room with the user's ID
      socket.join(userId);
      console.log(`User ${userId} connected and joined room ${userId}`);
    });

    // Handle private messaging
    socket.on('send_message', (messageData) => {
      const recipientSocket = userSockets.get(messageData.recipientId);
      
      console.log(`Message from ${messageData.senderId} to ${messageData.recipientId}`);
      
      if (recipientSocket) {
        // Send to specific user
        io.to(recipientSocket).emit('receive_message', messageData);
      }
    });

    // Handle typing status
    socket.on('typing', (data) => {
      const recipientSocket = userSockets.get(data.recipientId);
      
      console.log(`User ${data.senderId} is typing to ${data.recipientId}`);
      
      if (recipientSocket) {
        io.to(recipientSocket).emit('typing', {
          senderId: data.senderId,
          isTyping: true
        });
      }
    });

    // Handle stop typing
    socket.on('stop_typing', (data) => {
      const recipientSocket = userSockets.get(data.recipientId);
      
      console.log(`User ${data.senderId} stopped typing to ${data.recipientId}`);
      
      if (recipientSocket) {
        io.to(recipientSocket).emit('typing', {
          senderId: data.senderId,
          isTyping: false
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('Client disconnected', socket.id);
      
      if (socket.userId) {
        // Update user status to offline
        try {
          await User.findByIdAndUpdate(socket.userId, { isOnline: false });
          // Remove from userSockets map
          userSockets.delete(socket.userId);
          // Broadcast to all connected clients that this user is offline
          io.emit('user_status', { userId: socket.userId, isOnline: false });
        } catch (error) {
          console.error('Error updating user status on disconnect:', error);
        }
      }
    });
  });
};

module.exports = setupSocketIO;