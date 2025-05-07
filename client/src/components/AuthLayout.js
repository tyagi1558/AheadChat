import { Box, Container } from "@mui/material";

const AuthLayout = ({ children }) => {
  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Container maxWidth="sm">{children}</Container>
    </Box>
  );
};

export default AuthLayout;
