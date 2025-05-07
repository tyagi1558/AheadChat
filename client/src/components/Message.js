import { Box, Typography, Paper } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { styled } from "@mui/material/styles";
const AnimatedPaper = styled(Paper)(({ theme }) => ({
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    boxShadow: theme.shadows[8],
    transform: "translateY(-2px)",
  },
}));

const Message = ({ message, currentUser }) => {
  const isSentByUser =
    message.sender === currentUser || message.sender?._id === currentUser;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderStatusIcon = () => {
    if (!isSentByUser) return null;

    switch (message.status) {
      case "sent":
        return <DoneIcon fontSize="small" sx={{ color: "gray", ml: 0.5 }} />;
      case "delivered":
        return <DoneAllIcon fontSize="small" sx={{ color: "gray", ml: 0.5 }} />;
      case "read":
        return (
          <DoneAllIcon fontSize="small" sx={{ color: "#4fc3f7", ml: 0.5 }} />
        );
      default:
        return null;
    }
  };

  return (
    <Box
      display="flex"
      justifyContent={isSentByUser ? "flex-end" : "flex-start"}
      my={1}
      px={1}
    >
      <AnimatedPaper
        elevation={2}
        sx={{
          p: 1.5,
          maxWidth: { xs: "80%", sm: "70%" },
          backgroundColor: isSentByUser ? "primary.light" : "background.paper",
          color: isSentByUser ? "primary.contrastText" : "text.primary",
          borderRadius: 2,
          borderTopLeftRadius: isSentByUser ? 16 : 4,
          borderTopRightRadius: isSentByUser ? 4 : 16,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {message.content}
        </Typography>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="flex-end"
          mt={0.5}
        >
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {formatTime(message.createdAt)}
          </Typography>
          {renderStatusIcon()}
        </Box>
      </AnimatedPaper>
    </Box>
  );
};

export default Message;
