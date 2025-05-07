// import { useState, useEffect } from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import { styled, keyframes } from "@mui/material/styles";

// Create typing animation
const typingAnimation = keyframes`
  0% { opacity: 0.2; }
  20% { opacity: 1; }
  100% { opacity: 0.2; }
`;

const TypingDot = styled("span")(({ theme, delay }) => ({
  display: "inline-block",
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  backgroundColor: theme.palette.primary.main,
  margin: "0 2px",
  animation: `${typingAnimation} 1.4s infinite ease-in-out both`,
  animationDelay: `${delay}s`,
}));

const UserStatus = ({ isOnline, isTyping, userName }) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      {isTyping ? (
        <Tooltip title={`${userName || "User"} is typing...`}>
          <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
            <TypingDot delay={0} />
            <TypingDot delay={0.2} />
            <TypingDot delay={0.4} />
          </Box>
        </Tooltip>
      ) : (
        <Tooltip title={isOnline ? "Online" : "Offline"}>
          <CircleIcon
            sx={{
              fontSize: 12,
              color: isOnline ? "success.main" : "grey.500",
              mr: 1,
              transition: "color 0.3s ease",
            }}
          />
        </Tooltip>
      )}
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          display: { xs: "none", sm: "block" },
        }}
      >
        {isTyping ? "typing..." : isOnline ? "online" : "offline"}
      </Typography>
    </Box>
  );
};

export default UserStatus;
