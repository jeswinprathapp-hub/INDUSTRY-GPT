import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Chat from './pages/Chat';
import Machines from './pages/Machines';
import MachineDetail from './pages/MachineDetail';
import Troubleshooting from './pages/Troubleshooting';
import Maintenance from './pages/Maintenance';
import Analytics from './pages/Analytics';
import Landing from './pages/Landing';
import Search from './pages/Search';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          
          <Route path="/welcome" element={<Landing />} />
          
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="documents" element={<Documents />} />
            <Route path="search" element={<Search />} />
            <Route path="chat" element={<Chat />} />
            <Route path="troubleshooting" element={<Troubleshooting />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="machines" element={<Machines />} />
            <Route path="machines/:id" element={<MachineDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
