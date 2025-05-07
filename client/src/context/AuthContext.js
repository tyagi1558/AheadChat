import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { setupSocket, disconnectSocket } from "../socket";

const AuthContext = createContext();
axios.defaults.baseURL = process.env.REACT_APP_API_URL;
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from localStorage on first load
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);

      try {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setupSocket(userData._id);
        }
      } catch (err) {
        console.error("Error loading user:", err);
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  // Register user
  const register = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/register`,
        {
          username,
          password,
        }
      );

      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      setupSocket(data._id);

      return data;
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : "Registration failed"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        {
          username,
          password,
        }
      );

      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      setupSocket(data._id);

      return data;
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : "Login failed"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setLoading(true);

    try {
      if (user && user.token) {
        // Configure headers
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        await axios.post("/api/auth/logout", {}, config);
      }
    } catch (err) {
      console.error("Error during logout:", err);
    } finally {
      localStorage.removeItem("user");
      disconnectSocket();
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
