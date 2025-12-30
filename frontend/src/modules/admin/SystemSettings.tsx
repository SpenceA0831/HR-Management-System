import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  AlertTitle,
} from '@mui/material';
import { Info } from 'lucide-react';

export default function SystemSettings() {
  return (
    <Box sx={{ px: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        System Settings
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage system-wide configurations that apply across all modules
      </Typography>

      <Alert severity="info" icon={<Info size={20} />} sx={{ mb: 3 }}>
        <AlertTitle>Future Enhancements</AlertTitle>
        This section will include company-wide settings such as user management,
        role permissions, and global preferences.
      </Alert>

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Coming Soon
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>
              <Typography variant="body2" color="text.secondary">
                User Management - Add, edit, and remove users
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                Role & Permission Management - Configure access levels
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                Company Profile - Organization name, logo, and details
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                Notification Settings - Email and in-app notification preferences
              </Typography>
            </li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
