import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";
import "./App.css";
import { ColorModeProvider, useColorMode } from "./context/ThemeContext";

const PrivateRoute = ({ element }) => {
  const storedUser = localStorage.getItem("user");
  return storedUser ? element : <Navigate to="/login" />;
};

const ChatWithTheme = () => {
  const { toggleColorMode, mode } = useColorMode();
  return <Chat toggleTheme={toggleColorMode} isDarkMode={mode === "dark"} />;
};

function App() {
  return (
    <ColorModeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/chat"
              element={<PrivateRoute element={<ChatWithTheme />} />}
            />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ColorModeProvider>
  );
}

export default App;
