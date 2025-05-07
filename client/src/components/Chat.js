import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import socket from "../socket";
import ChatInput from "./ChatInput";
import UserStatus from "./UserStatus";
import ChatWindow from "./ChatWindow";

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
  const chatContainerRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [userStatus, setUserStatus] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  const [mainMenuAnchorEl, setMainMenuAnchorEl] = useState(null);
  const [themeMenuAnchorEl, setThemeMenuAnchorEl] = useState(null);
  const mainMenuOpen = Boolean(mainMenuAnchorEl);
  const themeMenuOpen = Boolean(themeMenuAnchorEl);

  const handleMainMenuOpen = (event) => {
    setMainMenuAnchorEl(event.currentTarget);
  };

  const handleMainMenuClose = () => {
    setMainMenuAnchorEl(null);
  };

  const handleThemeMenuOpen = (event) => {
    setThemeMenuAnchorEl(event.currentTarget);
    handleMainMenuClose();
  };

  const handleThemeMenuClose = () => {
    setThemeMenuAnchorEl(null);
  };

  const handleLogout = () => {
    handleMainMenuClose();
    if (logout) {
      logout();
    }
    navigate("/login");
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

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

    if (user && user._id) {
      socket.emit("setup", user._id);
    }
  }, [user, navigate]);

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

  useEffect(() => {
    if (!user) return;

    socket.on("receive_message", (messageData) => {
      if (currentChat && messageData.senderId === currentChat._id) {
        setMessages((prevMessages) => [...prevMessages, messageData.message]);
      }
    });

    socket.on("typing", ({ senderId, isTyping }) => {
      setUserStatus((prev) => {
        if (!prev[senderId]) return prev;
        return {
          ...prev,
          [senderId]: { ...prev[senderId], isTyping },
        };
      });
    });

    socket.on("user_status", ({ userId, isOnline }) => {
      setUserStatus((prev) => {
        if (!prev[userId]) return prev;
        return {
          ...prev,
          [userId]: { ...prev[userId], isOnline },
        };
      });
    });

    return () => {
      socket.off("receive_message");
      socket.off("typing");
      socket.off("user_status");
    };
  }, [user, currentChat]);

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

    if (isMobile) {
      setDrawerOpen(false);
    }
  }, [currentChat, user, isMobile]);

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

      const messageWithStatus = {
        ...data,
        status: "sent",
      };

      setMessages([...messages, messageWithStatus]);

      socket.emit("send_message", {
        senderId: user._id,
        recipientId: currentChat._id,
        message: messageWithStatus,
      });

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

      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  const selectUser = (selectedUser) => {
    setCurrentChat(selectedUser);
  };

  const handleErrorClose = () => {
    setError(null);
  };

  const drawerWidth = 300;

  const drawerContent = (
    <Box
      sx={{
        width: drawerWidth,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Chats
          </Typography>

          {/* Theme Menu */}
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

          {/* Main Menu */}
          <Menu
            anchorEl={mainMenuAnchorEl}
            open={mainMenuOpen}
            onClose={handleMainMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            sx={{ zIndex: 1301 }}
          >
            <MenuItem onClick={handleThemeMenuOpen}>
              <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
              Theme
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              Logout
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
          overflowY: "auto",
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
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            top: 0,
            left: 0,
            right: 0,
          }}
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
                onClick={handleThemeMenuOpen}
                aria-label="toggle theme"
              >
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            )}
            {/* FIX: Use mainMenuOpen for mobile view */}
            <IconButton color="inherit" onClick={handleMainMenuOpen}>
              <MoreIcon />
            </IconButton>

            {/* Theme Menu for mobile */}
            <Menu
              id="theme-menu-mobile"
              anchorEl={themeMenuAnchorEl}
              open={themeMenuOpen}
              onClose={handleThemeMenuClose}
            >
              <MenuItem
                onClick={() => {
                  toggleTheme();
                  handleThemeMenuClose();
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={isDarkMode ? "Light Mode" : "Dark Mode"}
                />
              </MenuItem>
            </Menu>

            {/* Main Menu for mobile */}
            <Menu
              anchorEl={mainMenuAnchorEl}
              open={mainMenuOpen}
              onClose={handleMainMenuClose}
            >
              <MenuItem onClick={handleThemeMenuOpen}>
                <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                Theme
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
      )}

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
            overflow: "hidden",
            ...(isMobile && {
              zIndex: theme.zIndex.drawer + 2,
            }),
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        ref={chatContainerRef}
        sx={{
          flexGrow: 1,
          p: 0,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          pt: isMobile ? "64px" : 0,
          overflow: "hidden",
          position: "relative",
        }}
      >
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
              <IconButton>
                <NotificationsIcon />
              </IconButton>
              {/* FIX: Use mainMenuOpen in header */}
              <IconButton onClick={handleMainMenuOpen}>
                <MoreIcon />
              </IconButton>

              {/* Theme Menu for desktop chat view */}
              <Menu
                id="theme-menu-desktop"
                anchorEl={themeMenuAnchorEl}
                open={themeMenuOpen}
                onClose={handleThemeMenuClose}
              >
                <MenuItem
                  onClick={() => {
                    toggleTheme();
                    handleThemeMenuClose();
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={isDarkMode ? "Light Mode" : "Dark Mode"}
                  />
                </MenuItem>
              </Menu>

              {/* Main Menu for desktop chat view */}
              <Menu
                anchorEl={mainMenuAnchorEl}
                open={mainMenuOpen}
                onClose={handleMainMenuClose}
              >
                <MenuItem onClick={handleThemeMenuOpen}>
                  <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                  Theme
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Toolbar>
          </AppBar>
        )}

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            height: currentChat ? "calc(100% - 70px)" : "100%",
          }}
        >
          {currentChat ? (
            <>
              <ChatWindow
                messages={messages}
                currentUser={user?._id}
                messagesEndRef={messagesEndRef}
              />
              <Box
                sx={{
                  position: "sticky",
                  bottom: 0,
                  width: "100%",
                  backgroundColor: theme.palette.background.paper,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  zIndex: 1,
                }}
              >
                <ChatInput
                  currentChat={currentChat}
                  sendMessage={sendMessage}
                  userId={user?._id}
                />
              </Box>
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
