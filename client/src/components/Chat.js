import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import socket from "../socket";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import UserStatus from "./UserStatus";

// Material UI imports
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Badge,
  Drawer,
  AppBar,
  Toolbar,
  useMediaQuery,
  useTheme,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  CircularProgress,
  Fade,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
} from "@mui/material";

import {
  Menu as MenuIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Archive as ArchiveIcon,
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from "@mui/icons-material";

const Chat = ({ toggleTheme, isDarkMode }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const messagesEndRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [userStatus, setUserStatus] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const [themeMenuAnchorEl, setThemeMenuAnchorEl] = useState(null);
  const themeMenuOpen = Boolean(themeMenuAnchorEl);

  // Handle menu opening
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle menu closing
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle theme menu
  const handleThemeMenuOpen = (event) => {
    setThemeMenuAnchorEl(event.currentTarget);
  };

  const handleThemeMenuClose = () => {
    setThemeMenuAnchorEl(null);
  };

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch users on component mount
  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate("/login");
      return;
    }

    // Fetch users
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.get("/api/users", config);
        setUsers(data);
        setFilteredUsers(data);

        // Initialize userStatus for all users
        const initialStatus = {};
        data.forEach((user) => {
          initialStatus[user._id] = {
            isOnline: user.isOnline,
            isTyping: false,
          };
        });
        setUserStatus(initialStatus);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load contacts. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    // Setup user connection when component mounts
    if (user && user._id) {
      socket.emit("setup", user._id);
    }
  }, [user, navigate]);

  // Filter users based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // Set up socket events
  useEffect(() => {
    if (!user) return;

    // Listen for incoming messages
    socket.on("receive_message", (messageData) => {
      if (currentChat && messageData.senderId === currentChat._id) {
        setMessages((prevMessages) => [...prevMessages, messageData.message]);
      }
    });

    // Listen for typing indicator
    socket.on("typing", ({ senderId, isTyping }) => {
      setUserStatus((prev) => {
        // Make sure we're not trying to update a non-existent user
        if (!prev[senderId]) return prev;
        return {
          ...prev,
          [senderId]: { ...prev[senderId], isTyping },
        };
      });
    });

    // Listen for user status changes
    socket.on("user_status", ({ userId, isOnline }) => {
      setUserStatus((prev) => {
        // Make sure we're not trying to update a non-existent user
        if (!prev[userId]) return prev;
        return {
          ...prev,
          [userId]: { ...prev[userId], isOnline },
        };
      });
    });

    // Cleanup on unmount
    return () => {
      socket.off("receive_message");
      socket.off("typing");
      socket.off("user_status");
    };
  }, [user, currentChat]);

  // Fetch messages when currentChat changes
  useEffect(() => {
    if (!currentChat || !user) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.get(
          `/api/messages/${currentChat._id}`,
          config
        );
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError("Failed to load messages. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Close drawer on mobile after selecting a chat
    if (isMobile) {
      setDrawerOpen(false);
    }
  }, [currentChat, user, isMobile]);

  // Handle sending messages
  const sendMessage = async (content) => {
    if (!content.trim() || !currentChat || !user) return;

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(
        "/api/messages",
        { recipientId: currentChat._id, content },
        config
      );

      // Add status to the message
      const messageWithStatus = {
        ...data,
        status: "sent", // Initially set as 'sent'
      };

      setMessages([...messages, messageWithStatus]);

      // Send message via socket
      socket.emit("send_message", {
        senderId: user._id,
        recipientId: currentChat._id,
        message: messageWithStatus,
      });

      // Simulate delivered and read statuses for demo purposes
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data._id ? { ...msg, status: "delivered" } : msg
          )
        );
      }, 1000);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data._id ? { ...msg, status: "read" } : msg
          )
        );
      }, 2000);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  // Handle user selection
  const selectUser = (selectedUser) => {
    setCurrentChat(selectedUser);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Handle error snackbar close
  const handleErrorClose = () => {
    setError(null);
  };

  const drawerWidth = 300;

  // Users sidebar drawer content
  const drawerContent = (
    <Box
      sx={{
        width: drawerWidth,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // Prevent overall drawer content from scrolling
      }}
    >
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Chats
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleThemeMenuOpen}
            aria-label="theme toggle"
          >
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <Menu
            id="theme-menu"
            anchorEl={themeMenuAnchorEl}
            open={themeMenuOpen}
            onClose={handleThemeMenuClose}
          >
            <MenuItem
              onClick={() => {
                toggleTheme();
                handleThemeMenuClose();
              }}
              sx={{ minWidth: "150px" }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={isDarkMode ? "Light Mode" : "Dark Mode"} />
            </MenuItem>
          </Menu>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <MoreIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              <ListItemAvatar>
                <Avatar>{user?.username?.[0]?.toUpperCase() || "U"}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={user?.username || "User"}
                secondary="Profile"
              />
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleMenuClose}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <SettingsIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="Settings" />
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <ArchiveIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="Archived Chats" />
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                  <LogoutIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Toolbar>
        <Box sx={{ px: 2, pb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search contacts..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </AppBar>
      <Divider />
      <List
        sx={{
          flexGrow: 1,
          overflowY: "auto", // Enable vertical scrolling for the list
          pb: 2,
          height: "100%",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: theme.palette.background.default,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.divider,
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        {loading && filteredUsers.length === 0 ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Box display="flex" justifyContent="center" p={4}>
            <Typography color="textSecondary">No contacts found</Typography>
          </Box>
        ) : (
          filteredUsers.map((u) => (
            <ListItem
              key={u._id}
              button
              selected={currentChat && currentChat._id === u._id}
              onClick={() => selectUser(u)}
              sx={{
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                "&.Mui-selected": {
                  backgroundColor: "primary.light",
                },
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  variant="dot"
                  sx={{
                    "& .MuiBadge-badge": {
                      backgroundColor: userStatus[u._id]?.isOnline
                        ? "success.main"
                        : "grey.500",
                    },
                  }}
                >
                  <Avatar>{u.username.charAt(0).toUpperCase()}</Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={u.username}
                secondary={
                  userStatus[u._id]?.isTyping ? (
                    <Typography variant="body2" color="primary">
                      typing...
                    </Typography>
                  ) : userStatus[u._id]?.isOnline ? (
                    "Online"
                  ) : (
                    "Offline"
                  )
                }
              />
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* Mobile app bar */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(!drawerOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1 }}
            >
              {currentChat ? currentChat.username : "Chat App"}
            </Typography>
            {currentChat ? (
              <UserStatus
                isOnline={userStatus[currentChat._id]?.isOnline || false}
                isTyping={userStatus[currentChat._id]?.isTyping || false}
                userName={currentChat.username}
              />
            ) : (
              <IconButton
                color="inherit"
                onClick={toggleTheme}
                aria-label="toggle theme"
              >
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            )}
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            overflow: "hidden", // Prevent outer drawer from scrolling
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main chat area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          mt: isMobile ? 8 : 0,
          overflow: "hidden", // Prevent main area from scrolling
        }}
      >
        {/* Chat header for desktop */}
        {!isMobile && currentChat && (
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
              <Avatar sx={{ mr: 2 }}>
                {currentChat.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{currentChat.username}</Typography>
                <UserStatus
                  isOnline={userStatus[currentChat._id]?.isOnline || false}
                  isTyping={userStatus[currentChat._id]?.isTyping || false}
                  userName={currentChat.username}
                />
              </Box>
              <IconButton onClick={toggleTheme} aria-label="toggle theme">
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
              <IconButton>
                <NotificationsIcon />
              </IconButton>
              <IconButton onClick={handleMenuOpen}>
                <MoreIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}

        {/* Chat messages */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden", // Prevent outer container from scrolling
          }}
        >
          {currentChat ? (
            <>
              <ChatWindow
                messages={messages}
                currentUser={user?._id}
                messagesEndRef={messagesEndRef}
              />
              <ChatInput
                currentChat={currentChat}
                sendMessage={sendMessage}
                userId={user?._id}
              />
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                p: 3,
              }}
            >
              <Paper
                elevation={3}
                sx={{ p: 4, maxWidth: 500, textAlign: "center" }}
              >
                <Typography variant="h5" gutterBottom>
                  Welcome to Chat App
                </Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                  Select a contact from the sidebar to start chatting
                </Typography>
                {isMobile && (
                  <Button
                    variant="contained"
                    startIcon={<MenuIcon />}
                    onClick={() => setDrawerOpen(true)}
                  >
                    View Contacts
                  </Button>
                )}
                <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
                  <FormControlLabel
                    control={
                      <Switch checked={isDarkMode} onChange={toggleTheme} />
                    }
                    label={isDarkMode ? "Dark Mode" : "Light Mode"}
                  />
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
      </Box>

      {/* Error snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleErrorClose}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={handleErrorClose}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Chat;
