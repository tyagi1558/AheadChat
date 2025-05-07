import { useEffect, useRef } from "react";
import Message from "./Message";
import { Box, CircularProgress } from "@mui/material";

const ChatWindow = ({ messages, currentUser }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!messages) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        p: 2,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.default",
      }}
    >
      {messages.map((msg, index) => (
        <Message
          key={msg._id || index}
          message={msg}
          currentUser={currentUser}
        />
      ))}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default ChatWindow;
