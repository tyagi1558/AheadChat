import { useState, useEffect, useRef } from "react";
import socket from "../socket";
import {
  TextField,
  IconButton,
  Paper,
  Tooltip,
  Zoom,
  Popover,
} from "@mui/material";
import {
  Send as SendIcon,
  EmojiEmotionsOutlined as EmojiIcon,
} from "@mui/icons-material";
import EmojiPicker from "emoji-picker-react";

const ChatInput = ({ currentChat, sendMessage, userId }) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const openEmojiPicker = (event) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const closeEmojiPicker = () => {
    setEmojiAnchorEl(null);
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", {
        senderId: userId,
        recipientId: currentChat._id,
        isTyping: true,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", {
        senderId: userId,
        recipientId: currentChat._id,
        isTyping: false,
      });
    }, 2000);
  };

  const handleSend = () => {
    if (message.trim() && currentChat) {
      sendMessage(message);
      setMessage("");

      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit("typing", {
        senderId: userId,
        recipientId: currentChat._id,
        isTyping: false,
      });

      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (inputRef.current && currentChat) {
      inputRef.current.focus();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentChat]);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1.5,
        display: "flex",
        alignItems: "center",
        borderTop: "1px solid",
        borderColor: "divider",
        borderRadius: 0,
      }}
    >
      <Tooltip title="Emoji" TransitionComponent={Zoom} arrow>
        <IconButton color="primary" size="medium" onClick={openEmojiPicker}>
          <EmojiIcon />
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(emojiAnchorEl)}
        anchorEl={emojiAnchorEl}
        onClose={closeEmojiPicker}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <EmojiPicker onEmojiClick={handleEmojiClick} />
      </Popover>

      <TextField
        fullWidth
        inputRef={inputRef}
        placeholder="Type a message..."
        variant="outlined"
        multiline
        maxRows={4}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          handleTyping();
        }}
        onKeyPress={handleKeyPress}
        disabled={!currentChat}
        sx={{ mx: 1 }}
        size="small"
      />

      <Tooltip title="Send message" TransitionComponent={Zoom} arrow>
        <span>
          <IconButton
            color="primary"
            size="medium"
            disabled={!message.trim() || !currentChat}
            onClick={handleSend}
            sx={{
              backgroundColor:
                message.trim() && currentChat ? "primary.main" : "transparent",
              color: message.trim() && currentChat ? "white" : "inherit",
              "&:hover": {
                backgroundColor:
                  message.trim() && currentChat
                    ? "primary.dark"
                    : "transparent",
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Paper>
  );
};

export default ChatInput;
