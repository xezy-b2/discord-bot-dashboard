import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import GuildSelect from './pages/GuildSelect';
import DashboardLayout from './pages/DashboardLayout';
import Welcome from './pages/Welcome';
import Leave from './pages/Leave';
import AutoRoles from './pages/AutoRoles';
import Automod from './pages/Automod';
import Moderation from './pages/Moderation';
import Leveling from './pages/Leveling';
import ReactionRoles from './pages/ReactionRoles';
import Tickets from './pages/Tickets';
import RecurringMessages from './pages/RecurringMessages';
import Birthdays from './pages/Birthdays';
import SocialNotifications from './pages/SocialNotifications';
import Economy from './pages/Economy';
import CustomCommands from './pages/CustomCommands';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<ProtectedRoute><GuildSelect /></ProtectedRoute>} />

        <Route path="/dashboard/:guildId" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="welcome" replace />} />
          <Route path="welcome" element={<Welcome />} />
          <Route path="leave" element={<Leave />} />
          <Route path="auto-roles" element={<AutoRoles />} />
          <Route path="automod" element={<Automod />} />
          <Route path="moderation" element={<Moderation />} />
          <Route path="leveling" element={<Leveling />} />
          <Route path="reaction-roles" element={<ReactionRoles />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="recurring-messages" element={<RecurringMessages />} />
          <Route path="birthdays" element={<Birthdays />} />
          <Route path="social-notifications" element={<SocialNotifications />} />
          <Route path="economy" element={<Economy />} />
          <Route path="commands" element={<CustomCommands />} />
          <Route path="logs" element={<Logs />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}