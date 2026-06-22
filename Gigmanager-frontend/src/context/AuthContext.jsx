import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import api from '../api/axios'; // 🔥 Importamos tu configuración de Axios

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 🔥 SI HAY USUARIO, LO SINCRONIZAMOS CON MYSQL
        try {
          await api.post('/users', {
            firebase_uid: user.uid,
            email: user.email,
            full_name: user.displayName || 'Freelancer'
          });
          console.log("Sincronización con MySQL exitosa");
        } catch (error) {
          console.error("Error sincronizando usuario con el Backend:", error);
        }
      }
      
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};