import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext'; // 🔥 1. IMPORTAMOS EL CONTEXTO
import { X, User, MapPin, Globe } from 'lucide-react';

const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const NewClientModal = ({ isOpen, onClose, onClientAdded, clientToEdit }) => {
  const { currentUser } = useAuth(); // 🔥 2. EXTRAEMOS TU USUARIO REAL

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    street: '', city: '', province: 'BC', postal_code: '', country: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = !!clientToEdit;

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        first_name: clientToEdit.first_name || '',
        last_name: clientToEdit.last_name || '',
        email: clientToEdit.email || '',
        phone: clientToEdit.phone || '',
        street: clientToEdit.street || '',
        city: clientToEdit.city || '',
        province: clientToEdit.province || 'BC',
        postal_code: clientToEdit.postal_code || '',
        country: clientToEdit.country || ''
      });
    } else {
      setFormData({ first_name: '', last_name: '', email: '', phone: '', street: '', city: '', province: 'BC', postal_code: '', country: '' });
    }
  }, [clientToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        // --- MODO EDITAR (PATCH) ---
        // 🔥 3. USAMOS currentUser.uid EN LUGAR DE 4
        await api.patch(`/addresses/${clientToEdit.address_id}`, {
          user_id: currentUser.uid, street: formData.street, city: formData.city, 
          province: formData.province, postal_code: formData.postal_code, country: formData.country
        });

        await api.patch(`/clients/${clientToEdit.id}`, {
          user_id: currentUser.uid, first_name: formData.first_name, last_name: formData.last_name, 
          email: formData.email, phone: formData.phone
        });

      } else {
        // --- MODO CREAR (POST) ---
        // 🔥 4. USAMOS currentUser.uid EN LUGAR DE 4
        const addrRes = await api.post('/addresses', {
          user_id: currentUser.uid, street: formData.street, city: formData.city, 
          province: formData.province, postal_code: formData.postal_code, country: formData.country
        });

        await api.post('/clients', {
          user_id: currentUser.uid, address_id: addrRes.data.addressId, first_name: formData.first_name, 
          last_name: formData.last_name, email: formData.email, phone: formData.phone
        });
      }

      onClientAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Error processing request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: '800' }}>
            {isEditMode ? 'Edit Client Profile' : 'Register Global Client'}
          </h2>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        {error && <div style={errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={label}><User size={12} /> NAME & CONTACT</div>
          <div style={row}>
            <input required style={input} placeholder="First Name" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
            <input required style={input} placeholder="Last Name" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
          </div>
          <input required style={input} type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input required style={input} placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />

          <div style={label}><MapPin size={12} /> LOCATION</div>
          <input required style={input} placeholder="Street (e.g., 103A Ave)" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
          <div style={row}>
            <input required style={input} placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
            <input required style={input} placeholder="Postal Code" value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f9f9fb', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }}>
            <Globe size={16} color="#7239ea" />
            <select required style={{ border: 'none', background: 'none', width: '100%', outline: 'none', fontSize: '14px' }} 
              value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})}>
              <option value="" disabled>Select Country</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button type="submit" disabled={isSubmitting} style={submitBtn}>
            {isSubmitting ? 'Processing...' : isEditMode ? 'Update Client' : 'Save Client Data'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- STYLES ---
const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 };
const modalStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '16px', width: '90%', maxWidth: '420px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const closeBtn = { background: 'none', border: 'none', cursor: 'pointer', color: '#a1a5b7' };
const label = { fontSize: '10px', fontWeight: 'bold', color: '#7239ea', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' };
const row = { display: 'flex', gap: '8px' };
const input = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #eee', fontSize: '14px', backgroundColor: '#f9f9fb' };
const submitBtn = { backgroundColor: '#7239ea', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };
const errorBox = { color: '#ef4444', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '10px' };

export default NewClientModal;