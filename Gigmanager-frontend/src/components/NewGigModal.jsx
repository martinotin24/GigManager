import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext'; // 🔥 1. IMPORTAMOS EL CONTEXTO
import { X, Calendar, MapPin, DollarSign, User, Music, FileText } from 'lucide-react';

const NewGigModal = ({ isOpen, onClose, onGigAdded, gigToEdit, onPromptQuote }) => {
  const { currentUser } = useAuth(); // 🔥 2. EXTRAEMOS TU USUARIO REAL

  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    gig_date: '',
    venue: '',
    fee: '',
    status: 'pending',
    description: ''
  });
  
  const [clients, setClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = !!gigToEdit;

  // 1. Cargar la lista de clientes cuando se abre el modal
  useEffect(() => {
    // 🔥 3. ASEGURAMOS QUE HAY USUARIO ANTES DE PEDIR DATOS
    if (isOpen && currentUser) {
      setIsLoadingClients(true);
      api.get(`/clients?user_id=${currentUser.uid}`)
        .then(res => {
          setClients(res.data);
          setIsLoadingClients(false);
        })
        .catch(err => {
          console.error("Error fetching clients for dropdown:", err);
          setIsLoadingClients(false);
          setError("Could not load clients list.");
        });
    }
  }, [isOpen, currentUser]); // Añadimos currentUser a las dependencias

  // 2. Pre-llenar datos si estamos en modo Edición
  useEffect(() => {
    if (gigToEdit) {
      const formattedDate = gigToEdit.event_date ? gigToEdit.event_date.split('T')[0] : '';
      setFormData({
        title: gigToEdit.title || '',
        client_id: gigToEdit.client_id || '',
        gig_date: formattedDate,
        venue: gigToEdit.venue || '',
        fee: gigToEdit.fee || '',
        status: gigToEdit.status || 'pending',
        description: gigToEdit.description || ''
      });
    } else {
      setFormData({
        title: '', client_id: '', gig_date: '', venue: '', fee: '', status: 'pending', description: ''
      });
    }
  }, [gigToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        // --- MODO EDITAR (PATCH) ---
        const patchPayload = {
          user_id: currentUser.uid, // 🔥 4. USAMOS TU UID
          title: formData.title,
          gig_date: formData.gig_date,
          venue: formData.venue,
          fee: parseFloat(formData.fee),
          status: formData.status,
          description: formData.description
        };
        
        await api.patch(`/gigs/${gigToEdit.id}`, patchPayload);
        onGigAdded(); 
        onClose(); 

      } else {
        // --- MODO CREAR (POST) ---
        const selectedClient = clients.find(c => c.id === parseInt(formData.client_id));
        const clientAddressId = selectedClient ? selectedClient.address_id : null;

        const postPayload = {
          user_id: currentUser.uid, // 🔥 5. USAMOS TU UID
          client_id: formData.client_id,
          address_id: clientAddressId,
          title: formData.title,
          gig_date: formData.gig_date,
          venue: formData.venue,
          fee: parseFloat(formData.fee),
          status: formData.status,
          description: formData.description
        };

        const res = await api.post('/gigs', postPayload);
        const newGigId = res.data.gigId; 

        onGigAdded(); 
        onClose(); 

        setTimeout(() => {
          if (onPromptQuote) {
            onPromptQuote({ 
              gigId: newGigId, 
              clientId: formData.client_id, 
              fee: formData.fee 
            });
          }
        }, 400);
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error processing gig.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        {/* HEADER */}
        <div style={headerStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Music size={20} color="#7239ea" />
            {isEditMode ? 'Edit Gig Details' : 'Create New Gig'}
          </h2>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        {error && <div style={errorBox}>{error}</div>}

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* CLIENT SELECTION */}
          <div style={label}><User size={12} /> SELECT CLIENT</div>
          <select 
            required 
            style={input} 
            value={formData.client_id} 
            onChange={e => setFormData({...formData, client_id: e.target.value})}
            disabled={isLoadingClients || isEditMode}
          >
            <option value="" disabled>
              {isLoadingClients ? 'Loading clients...' : '-- Choose a registered client --'}
            </option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name} ({c.email})
              </option>
            ))}
          </select>

          {/* EVENT DETAILS */}
          <div style={label}><FileText size={12} /> EVENT INFO</div>
          <input 
            required 
            style={input} 
            placeholder="Event Title (e.g., Summer Wedding Ceremony)" 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
          />
          
          <div style={row}>
            <div style={{ flex: 1 }}>
              <div style={{...label, marginTop: 0}}><Calendar size={12} /> DATE</div>
              <input 
                required 
                type="date" 
                style={input} 
                value={formData.gig_date} 
                onChange={e => setFormData({...formData, gig_date: e.target.value})} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{...label, marginTop: 0}}>STATUS</div>
              <select 
                required 
                style={input} 
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* LOGISTICS & PAY */}
          <div style={label}><MapPin size={12} /> LOGISTICS & PAYMENT</div>
          <input 
            required 
            style={input} 
            placeholder="Venue Name (e.g., Fairmont Hotel)" 
            value={formData.venue} 
            onChange={e => setFormData({...formData, venue: e.target.value})} 
          />
          <div style={{ position: 'relative' }}>
            <DollarSign size={16} color="#a1a5b7" style={{ position: 'absolute', top: '10px', left: '10px' }} />
            <input 
              required 
              type="number" 
              step="0.01" 
              style={{...input, paddingLeft: '35px'}} 
              placeholder="Agreed Fee (CAD)" 
              value={formData.fee} 
              onChange={e => setFormData({...formData, fee: e.target.value})} 
            />
          </div>

          {/* DESCRIPTION */}
          <div style={label}>NOTES</div>
          <textarea 
            style={{...input, minHeight: '60px', resize: 'vertical'}} 
            placeholder="Special requests, dress code, repertoire..." 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
          />

          <button type="submit" disabled={isSubmitting} style={submitBtn}>
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Gig' : 'Save Gig'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- STYLES ---
const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 };
const modalStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '16px', width: '90%', maxWidth: '450px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const closeBtn = { background: 'none', border: 'none', cursor: 'pointer', color: '#a1a5b7' };
const label = { fontSize: '10px', fontWeight: 'bold', color: '#7239ea', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', textTransform: 'uppercase' };
const row = { display: 'flex', gap: '10px' };
const input = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #eff2f5', fontSize: '14px', backgroundColor: '#f9f9fb', outline: 'none' };
const submitBtn = { backgroundColor: '#7239ea', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', width: '100%' };
const errorBox = { color: '#ef4444', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '10px' };

export default NewGigModal;