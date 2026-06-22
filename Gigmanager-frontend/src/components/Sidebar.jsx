import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { Home, Users, Music, FileText, FileCheck, LogOut, User as UserIcon } from 'lucide-react';

const Sidebar = () => {
  const { currentUser } = useAuth(); // Obtenemos tus datos de Google
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div style={sidebarStyle}>
      {/* Logo & App Name */}
      <div style={logoContainerStyle}>
        <img src="/violin.ico" alt="Logo" style={logoStyle} />
        <h2 style={appNameStyle}>GigManager</h2>
      </div>

      {/* Navigation Links */}
      <nav style={navStyle}>
        <NavLink to="/" style={({ isActive }) => (isActive ? activeNavItemStyle : navItemStyle)}>
          <Home size={20} /> Dashboard
        </NavLink>
        <NavLink to="/clients" style={({ isActive }) => (isActive ? activeNavItemStyle : navItemStyle)}>
          <Users size={20} /> Clients
        </NavLink>
        <NavLink to="/gigs" style={({ isActive }) => (isActive ? activeNavItemStyle : navItemStyle)}>
          <Music size={20} /> Gigs
        </NavLink>
        <NavLink to="/quotes" style={({ isActive }) => (isActive ? activeNavItemStyle : navItemStyle)}>
          <FileCheck size={20} /> Quotes
        </NavLink>
        <NavLink to="/invoices" style={({ isActive }) => (isActive ? activeNavItemStyle : navItemStyle)}>
          <FileText size={20} /> Invoices
        </NavLink>
      </nav>

      {/* User Profile & Logout */}
      <div style={userSectionStyle}>
        <div style={userInfoStyle}>
          <div style={avatarStyle}>
            {/* Si tienes foto en Google, la mostramos, sino un ícono */}
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '10px' }} />
            ) : (
              <UserIcon size={16} />
            )}
          </div>
          <div style={userDetailsStyle}>
            {/* Mostramos tu nombre de Google */}
            <span style={userNameStyle}>{currentUser?.displayName || 'Freelancer'}</span>
            <span style={userEmailStyle}>{currentUser?.email}</span>
          </div>
        </div>
        <button onClick={handleLogout} style={logoutBtnStyle}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
};

// --- ESTILOS (¡Aquí estaba el error, faltaban estos!) ---
const sidebarStyle = {
  width: '260px',
  backgroundColor: '#1e1e2d',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  position: 'fixed',
  left: 0,
  top: 0,
  boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
  zIndex: 100
};

const logoContainerStyle = { display: 'flex', alignItems: 'center', gap: '15px', padding: '30px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const logoStyle = { width: '40px', height: '40px', objectFit: 'contain' };
const appNameStyle = { fontSize: '22px', fontWeight: '900', margin: 0, letterSpacing: '0.5px' };

const navStyle = { display: 'flex', flexDirection: 'column', gap: '5px', padding: '25px 15px', flex: 1 };
const navItemStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', color: '#a1a5b7', textDecoration: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', transition: 'all 0.2s' };
const activeNavItemStyle = { ...navItemStyle, backgroundColor: '#009ef7', color: 'white' };

const userSectionStyle = { padding: '20px 15px', borderTop: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' };
const userInfoStyle = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px', padding: '0 10px' };
const avatarStyle = { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#3f4254', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a5b7' };
const userDetailsStyle = { display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const userNameStyle = { fontSize: '14px', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const userEmailStyle = { fontSize: '12px', color: '#a1a5b7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const logoutBtnStyle = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a5b7', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', transition: '0.2s' };

export default Sidebar;