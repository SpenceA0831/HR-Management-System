import { Box, Container, Typography, Card, CardContent } from '@mui/material';

export default function EvaluationDashboard() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Staff Evaluations Dashboard
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome to the Staff Evaluations module
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
            <li>Self-assessments</li>
            <li>Peer reviews</li>
            <li>Manager evaluations</li>
            <li>360-degree feedback analysis</li>
            <li>Growth reports and competency tracking</li>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
