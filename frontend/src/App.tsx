import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getTheme } from './theme/theme';
import { useStore } from './store/useStore';

// Pages
import SignIn from './pages/SignIn';
import ModuleSelector from './pages/ModuleSelector';
import Layout from './components/Layout';

// PTO Module Pages
import PtoDashboard from './modules/pto/Dashboard';
import PtoRequestsList from './modules/pto/RequestsList';
import PtoNewRequest from './modules/pto/NewRequest';
import PtoRequestDetail from './modules/pto/RequestDetail';

// Evaluation Module Pages (placeholders - to be created)
import EvaluationDashboard from './modules/evaluations/Dashboard';

// Admin Module Pages
import AdminDashboard from './modules/admin/Dashboard';

function App() {
  const { mode, isAuthenticated } = useStore();
  const theme = getTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <BrowserRouter>
          {!isAuthenticated ? (
            <Routes>
              <Route path="/" element={<SignIn />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<ModuleSelector />} />

                {/* PTO Module Routes */}
                <Route path="pto">
                  <Route index element={<PtoDashboard />} />
                  <Route path="requests" element={<PtoRequestsList />} />
                  <Route path="requests/new" element={<PtoNewRequest />} />
                  <Route path="requests/:id" element={<PtoRequestDetail />} />
                </Route>

                {/* Evaluation Module Routes */}
                <Route path="evaluations">
                  <Route index element={<EvaluationDashboard />} />
                  {/* More routes will be added */}
                </Route>

                {/* Admin Module Routes */}
                <Route path="admin">
                  <Route index element={<AdminDashboard />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          )}
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
