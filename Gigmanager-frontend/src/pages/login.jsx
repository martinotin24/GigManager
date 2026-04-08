import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// 🔥 IMPORTAMOS LO NECESARIO PARA GOOGLE
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Login clásico con Correo
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 NUEVO: Función para Login con Google
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setIsLoading(true);
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to sign in with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={logoWrapper}>
            <img src="/violin.ico" alt="Logo" style={{ width: '40px' }} />
          </div>
          <h1 style={{ fontSize: '24px', color: '#181c32', fontWeight: '900', margin: '0 0 8px 0' }}>GigManager</h1>
          <p style={{ color: '#a1a5b7', margin: 0, fontSize: '14px', fontWeight: '500' }}>Sign in to manage your gigs</p>
        </div>

        {error && (
          <div style={errorBox}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>EMAIL ADDRESS</label>
            <div style={inputWrapper}>
              <Mail size={18} color="#a1a5b7" style={iconStyle} />
              <input 
                type="email" 
                required 
                style={inputStyle} 
                placeholder="freelance@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={isLoading} 
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={labelStyle}>PASSWORD</label>
            </div>
            <div style={inputWrapper}>
              <Lock size={18} color="#a1a5b7" style={iconStyle} />
              <input 
                type="password" 
                required 
                style={inputStyle} 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={isLoading} 
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} style={submitBtn}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
          </button>
        </form>

        {/* 🔥 BOTÓN DE GOOGLE AÑADIDO AQUÍ */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '25px 0', gap: '15px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#eff2f5' }}></div>
          <span style={{ fontSize: '12px', color: '#a1a5b7', fontWeight: '800' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#eff2f5' }}></div>
        </div>

        <button type="button" onClick={handleGoogleLogin} style={googleBtnStyle} disabled={isLoading}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" alt="Google" />
          Continue with Google
        </button>
        {/* 🔥 FIN BOTÓN GOOGLE */}

        <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '14px', color: '#7e8299' }}>
          Don't have an account? <Link to="/register" style={{ color: '#009ef7', textDecoration: 'none', fontWeight: 'bold' }}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

// --- ESTILOS ---
const pageStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f9', padding: '20px' };
const cardStyle = { backgroundColor: 'white', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' };
const logoWrapper = { width: '60px', height: '60px', backgroundColor: '#f1faff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' };
const labelStyle = { fontSize: '11px', fontWeight: '800', color: '#3f4254', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'block' };
const inputWrapper = { position: 'relative' };
const iconStyle = { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' };
const inputStyle = { width: '100%', padding: '12px 15px 12px 42px', borderRadius: '10px', border: '1px solid #e4e6ef', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' };
const submitBtn = { width: '100%', padding: '14px', backgroundColor: '#009ef7', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', transition: 'background 0.2s' };
const errorBox = { backgroundColor: '#fff5f8', color: '#f1416c', padding: '12px 15px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' };
const googleBtnStyle = { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', backgroundColor: 'white', color: '#3f4254', border: '1px solid #e4e6ef', padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: '0.2s' };

export default Login;