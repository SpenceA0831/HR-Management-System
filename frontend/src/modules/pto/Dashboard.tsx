import { Box, Container, Typography, Card, CardContent } from '@mui/material';

export default function PtoDashboard() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        PTO Dashboard
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome to the PTO Tracker module
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This module is under construction. Features will include:
          </Typography>
          <Box component="ul" sx={{ mt: 2 }}>
            <li>View PTO balance</li>
            <li>Submit time-off requests</li>
            <li>Track request status</li>
            <li>Team calendar view</li>
            <li>Manager approval workflow</li>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
