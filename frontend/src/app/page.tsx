import { Typography, Container, Box } from "@mui/material";

export default function Home() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Task Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to the Task Management application.
        </Typography>
      </Box>
    </Container>
  );
}
