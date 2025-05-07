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
  IconButton,
  InputAdornment,
} from "@mui/material";
import { LockOutlined, Visibility, VisibilityOff } from "@mui/icons-material";
import AuthLayout from "../components/AuthLayout";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!formData.username || !formData.password) {
      setFormError("Please enter all fields");
      return;
    }

    try {
      await login(formData.username, formData.password);
      setSuccessMessage("Login successful! Redirecting...");
      setTimeout(() => navigate("/chat"), 1500);
    } catch (err) {
      console.error("Login error:", err);
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
              <LockOutlined sx={{ color: "#fff" }} />
            </Box>

            <Typography variant="h4" fontWeight="bold" color="primary">
              Login
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
              value={formData.username}
              onChange={onChange}
              fullWidth
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={onChange}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button type="submit" variant="contained" fullWidth size="large">
              Login
            </Button>

            <Typography variant="body2" color="textSecondary">
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{ color: "#1976d2", textDecoration: "none" }}
              >
                Register
              </Link>
            </Typography>
          </Stack>
        </form>
      </Paper>
    </AuthLayout>
  );
};

export default Login;
