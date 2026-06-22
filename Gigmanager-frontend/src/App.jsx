import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Importamos Componentes y Páginas
import Sidebar from './components/Sidebar';
import Login from './pages/login';
import Dashboard from './pages/dashboard'; 
import Gigs from './pages/gigs';
import Clients from './pages/clients';
import Quotes from './pages/quotes';
import Invoices from './pages/invoices';
import Register from './pages/register'; // ✅ Importación correcta

// Componente temporal refinado
const PlaceholderPage = ({ title }) => (
  <div style={{ padding: '30px' }}>
    <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>{title}</h1>
    <p style={{ color: '#666' }}>Próximamente para la Milestone #4...</p>
  </div>
);

// 🔥 NUEVO: Este es el envoltorio que pone el menú lateral solo donde se necesita
const AppLayout = ({ children }) => (
  <div style={{ display: 'flex' }}>
    {/* El Menú que siempre está visible (Ancho: 250px, Fijo) */}
    <Sidebar />

    {/* El Contenido Principal */}
    <main style={{ 
      flexGrow: 1, 
      marginLeft: '250px', /* Empuja el contenido a la derecha del Sidebar */
      backgroundColor: '#f5f5f9', 
      minHeight: '100vh',
      width: 'calc(100% - 250px)' /* Evita que la pantalla se desborde */
    }}>
      {children}
    </main>
  </div>
);

function App() {
  return (
    // Envolvemos todo en el AuthProvider para que la app sepa si hay alguien conectado
    <AuthProvider>
      <Router>
        <Routes>
          
          {/* 🔴 RUTAS PÚBLICAS (No llevan Sidebar) */}
          <Route path="/login" element={<Login />} />
          {/* 🔥 LÍNEA AÑADIDA: Ruta para la pantalla de registro */}
          <Route path="/register" element={<Register />} />

          {/* 🟢 RUTAS PRIVADAS (Llevan protección y el AppLayout con el Sidebar) */}
          <Route 
            path="/" 
            element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} 
          />
          <Route 
            path="/gigs" 
            element={<ProtectedRoute><AppLayout><Gigs /></AppLayout></ProtectedRoute>} 
          />
          <Route 
            path="/clients" 
            element={<ProtectedRoute><AppLayout><Clients /></AppLayout></ProtectedRoute>} 
          />
          <Route 
            path="/quotes" 
            element={<ProtectedRoute><AppLayout><Quotes /></AppLayout></ProtectedRoute>} 
          />
          <Route 
            path="/invoices" 
            element={<ProtectedRoute><AppLayout><Invoices /></AppLayout></ProtectedRoute>} 
          />
          <Route 
            path="/settings" 
            element={<ProtectedRoute><AppLayout><PlaceholderPage title="Settings" /></AppLayout></ProtectedRoute>} 
          />
          
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;