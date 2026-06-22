import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// 🔥 IMPORTAMOS updateProfile PARA GUARDAR EL NOMBRE
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState(''); // 🔥 NUEVO ESTADO PARA EL NOMBRE
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setIsLoading(true);
    setError('');
    
    try {
      // 1. Creamos la cuenta con correo y contraseña
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 🔥 2. LE ASIGNAMOS EL NOMBRE AL PERFIL RECIÉN CREADO
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // 3. Redirigimos al Dashboard
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to create an account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', color: '#181c32', fontWeight: '900', margin: '0 0 8px 0' }}>Create Account</h1>
          <p style={{ color: '#a1a5b7', margin: 0, fontSize: '14px', fontWeight: '500' }}>Start managing your freelance gigs today.</p>
        </div>

        {error && (
          <div style={errorBox}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 🔥 NUEVO CAMPO PARA EL NOMBRE */}
          <div>
            <label style={labelStyle}>FULL NAME</label>
            <div style={inputWrapper}>
              <User size={18} color="#a1a5b7" style={iconStyle} />
              <input 
                type="text" 
                required 
                style={inputStyle} 
                placeholder="John Doe" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                disabled={isLoading} 
              />
            </div>
          </div>

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
            <label style={labelStyle}>PASSWORD</label>
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
                minLength="6"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>CONFIRM PASSWORD</label>
            <div style={inputWrapper}>
              <Lock size={18} color="#a1a5b7" style={iconStyle} />
              <input 
                type="password" 
                required 
                style={inputStyle} 
                placeholder="••••••••" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                disabled={isLoading} 
                minLength="6"
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} style={submitBtn}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '14px', color: '#7e8299' }}>
          Already have an account? <Link to="/login" style={{ color: '#009ef7', textDecoration: 'none', fontWeight: 'bold' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
};

// --- ESTILOS ---
const pageStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f9', padding: '20px' };
const cardStyle = { backgroundColor: 'white', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' };
const labelStyle = { fontSize: '11px', fontWeight: '800', color: '#3f4254', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'block' };
const inputWrapper = { position: 'relative' };
const iconStyle = { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' };
const inputStyle = { width: '100%', padding: '12px 15px 12px 42px', borderRadius: '10px', border: '1px solid #e4e6ef', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' };
const submitBtn = { width: '100%', padding: '14px', backgroundColor: '#181c32', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', transition: 'background 0.2s', marginTop: '10px' };
const errorBox = { backgroundColor: '#fff5f8', color: '#f1416c', padding: '12px 15px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' };

export default Register;