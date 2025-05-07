const User = require("../models/User");

const setupSocketIO = (io) => {
  const userSockets = new Map();

  io.on("connection", (socket) => {
    socket.on("setup", async (userId) => {
      userSockets.set(userId, socket.id);
      socket.userId = userId;

      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit("user_status", { userId, isOnline: true });
      } catch (error) {
        console.error("Error updating user status:", error);
      }

      socket.join(userId);
      console.log(`User ${userId} connected and joined room ${userId}`);
    });

    socket.on("send_message", (messageData) => {
      const recipientSocket = userSockets.get(messageData.recipientId);

      if (recipientSocket) {
        io.to(recipientSocket).emit("receive_message", messageData);
      }
    });

    socket.on("typing", (data) => {
      const recipientSocket = userSockets.get(data.recipientId);

      if (recipientSocket) {
        io.to(recipientSocket).emit("typing", {
          senderId: data.senderId,
          isTyping: true,
        });
      }
    });

    socket.on("stop_typing", (data) => {
      const recipientSocket = userSockets.get(data.recipientId);

      if (recipientSocket) {
        io.to(recipientSocket).emit("typing", {
          senderId: data.senderId,
          isTyping: false,
        });
      }
    });

    socket.on("disconnect", async () => {
      if (socket.userId) {
        try {
          await User.findByIdAndUpdate(socket.userId, { isOnline: false });
          userSockets.delete(socket.userId);
          io.emit("user_status", { userId: socket.userId, isOnline: false });
        } catch (error) {
          console.error("Error updating user status on disconnect:", error);
        }
      }
    });
  });
};

module.exports = setupSocketIO;
