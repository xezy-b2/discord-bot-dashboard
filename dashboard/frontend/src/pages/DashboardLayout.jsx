import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8 max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
}
