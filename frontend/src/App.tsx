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

// PTO Module Pages (placeholders - to be created)
import PtoDashboard from './modules/pto/Dashboard';

// Evaluation Module Pages (placeholders - to be created)
import EvaluationDashboard from './modules/evaluations/Dashboard';

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
                  {/* More routes will be added */}
                </Route>

                {/* Evaluation Module Routes */}
                <Route path="evaluations">
                  <Route index element={<EvaluationDashboard />} />
                  {/* More routes will be added */}
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
