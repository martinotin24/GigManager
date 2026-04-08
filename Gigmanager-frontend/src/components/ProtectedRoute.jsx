import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  // Si no hay un usuario logueado, lo mandamos al login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Si está logueado, lo dejamos pasar a la pantalla que pidió
  return children;
};

export default ProtectedRoute;