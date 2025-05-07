import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Stack,
  Paper,
} from "@mui/material";
import { PersonAddAlt } from "@mui/icons-material";
import AuthLayout from "../components/AuthLayout"; // Make sure the path is correct

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { register, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const { username, password, confirmPassword } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!username || !password || !confirmPassword) {
      setFormError("Please enter all fields");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }

    try {
      await register(username, password);
      setSuccessMessage("Registration successful! Redirecting...");
      setTimeout(() => navigate("/chat"), 1500);
    } catch (err) {
      console.error("Registration error:", err);
    }
  };

  return (
    <AuthLayout>
      <Paper
        elevation={6}
        sx={{
          p: 5,
          borderRadius: 4,
          backgroundColor: "#ffffffee",
        }}
      >
        <form onSubmit={onSubmit}>
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                backgroundColor: "#1976d2",
                borderRadius: "50%",
                padding: 1,
                mb: 1,
              }}
            >
              <PersonAddAlt sx={{ color: "#fff" }} />
            </Box>

            <Typography variant="h4" fontWeight="bold" color="primary">
              Register
            </Typography>

            {(formError || error) && (
              <Alert severity="error">{formError || error}</Alert>
            )}
            {successMessage && (
              <Alert severity="success">{successMessage}</Alert>
            )}

            <TextField
              label="Username"
              name="username"
              value={username}
              onChange={onChange}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              fullWidth
            />
            <TextField
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              fullWidth
            />

            <Button type="submit" variant="contained" fullWidth size="large">
              Register
            </Button>

            <Typography variant="body2" color="textSecondary">
              Already have an account?{" "}
              <Link
                to="/login"
                style={{ color: "#1976d2", textDecoration: "none" }}
              >
                Login
              </Link>
            </Typography>
          </Stack>
        </form>
      </Paper>
    </AuthLayout>
  );
};

export default Register;
