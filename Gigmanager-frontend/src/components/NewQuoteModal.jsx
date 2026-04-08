import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext'; // 🔥 1. IMPORTAMOS EL CONTEXTO
import { X, FileText, Calendar, DollarSign, Clock, MapPin, AlignLeft, Music, Wallet, Briefcase } from 'lucide-react';

const NewQuoteModal = ({ isOpen, onClose, initialData, onQuoteAdded }) => {
  const { currentUser } = useAuth(); // 🔥 2. EXTRAEMOS TU USUARIO REAL

  const [formData, setFormData] = useState({
    gig_id: '',
    quote_number: '',
    valid_until: '',
    total_amount: '',
    deposit_amount: '',
    service_name: 'Live Violin Performance',
    service_description: 'Includes preparation, instrument maintenance, travel, and live performance execution.',
    event_date: '',
    event_time: '',
    venue: '',
    status: 'Pending'
  });
  
  const [gigsList, setGigsList] = useState([]);
  const [isLoadingGigs, setIsLoadingGigs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 🔥 3. ASEGURAMOS QUE HAY USUARIO ANTES DE PEDIR DATOS
    if (isOpen && !initialData?.gigId && currentUser) {
      setIsLoadingGigs(true);
      api.get(`/gigs?user_id=${currentUser.uid}`) // 🔥 USAMOS EL UID DINÁMICO
        .then(res => {
          setGigsList(res.data);
          setIsLoadingGigs(false);
        })
        .catch(err => {
          console.error("Error fetching gigs:", err);
          setIsLoadingGigs(false);
        });
    }
  }, [isOpen, initialData, currentUser]); // 🔥 RECARGA SI EL USUARIO CAMBIA

  useEffect(() => {
    if (isOpen) {
      const randomId = Math.floor(100 + Math.random() * 900);
      const year = new Date().getFullYear();
      const autoNumber = `QT-${year}-${randomId}`;
      
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 30);
      const formattedDate = expDate.toISOString().split('T')[0];

      setFormData({
        gig_id: initialData?.gigId || '', 
        quote_number: autoNumber,
        valid_until: formattedDate,
        total_amount: initialData?.fee || '', 
        deposit_amount: '',
        service_name: 'Live Violin Performance',
        service_description: 'Includes preparation, instrument maintenance, travel, and live performance execution.',
        event_date: '',
        event_time: '',
        venue: '',
        status: 'Pending'
      });
    }
  }, [isOpen, initialData]);

  const handleGigSelection = (e) => {
    const selectedGigId = e.target.value;
    const selectedGig = gigsList.find(g => g.id === parseInt(selectedGigId));
    
    setFormData({
      ...formData,
      gig_id: selectedGigId,
      total_amount: selectedGig ? selectedGig.fee : formData.total_amount,
      event_date: selectedGig && selectedGig.event_date ? selectedGig.event_date.split('T')[0] : '',
      venue: selectedGig ? selectedGig.venue : ''
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.gig_id) throw new Error("Please select a Gig for this quote.");

      const payload = {
        user_id: currentUser.uid, // 🔥 4. GUARDAMOS LA COTIZACIÓN CON TU UID
        gig_id: formData.gig_id,
        quote_number: formData.quote_number,
        service_name: formData.service_name,
        service_description: formData.service_description,
        event_date: formData.event_date,
        event_time: formData.event_time,
        venue: formData.venue,
        valid_until: formData.valid_until,
        total_amount: parseFloat(formData.total_amount),
        deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : 0,
        status: formData.status
      };

      await api.post('/quotes', payload);
      if (onQuoteAdded) onQuoteAdded(); 
      onClose();
      
    } catch (err) {
      console.error("Error creating quote:", err);
      setError(err.response?.data?.error || "Failed to save the quote.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        {/* HEADER */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={iconCircle}><FileText size={24} /></div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 4px 0', color: '#181c32' }}>Generate Quote</h2>
              <p style={{ fontSize: '12px', color: '#7e8299', margin: 0, fontWeight: '600' }}>
                {initialData?.gigId ? `Linking to Gig #${initialData.gigId}` : 'Create standalone quote'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={22} /></button>
        </div>

        {error && <div style={errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* AVISO DE SELECCIÓN DE GIG CON CLIENTE */}
          {!initialData?.gigId && (
            <div style={{...sectionCard, border: '1px solid #009ef7', backgroundColor: '#f1faff'}}>
              <label style={{...labelStyle, color: '#009ef7'}}><Music size={14} /> Step 1: Select Event</label>
              <select required style={{...inputStyle, border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'}} value={formData.gig_id} onChange={handleGigSelection} disabled={isLoadingGigs}>
                <option value="" disabled>{isLoadingGigs ? 'Loading gigs...' : '-- Select an existing Gig --'}</option>
                {gigsList.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.title} | {g.client_first_name} {g.client_last_name} ({g.event_date ? g.event_date.split('T')[0] : 'No date'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* SECCIÓN 1: SERVICIO */}
          <div style={sectionCard}>
            <h3 style={sectionTitle}><Briefcase size={16} /> Service Details</h3>
            <div style={inputGroup}>
              <label style={labelStyle}>Service Title</label>
              <input required style={inputStyle} value={formData.service_name} onChange={e => setFormData({...formData, service_name: e.target.value})} placeholder="e.g. Wedding Ceremony Package" />
            </div>
            <div style={{...inputGroup, marginTop: '12px'}}>
              <label style={labelStyle}>Description / Inclusions</label>
              <textarea style={{...inputStyle, resize: 'vertical', minHeight: '70px'}} value={formData.service_description} onChange={e => setFormData({...formData, service_description: e.target.value})} placeholder="What does this include?" />
            </div>
          </div>

          {/* SECCIÓN 2: LOGÍSTICA */}
          <div style={sectionCard}>
            <h3 style={sectionTitle}><MapPin size={16} /> Event Logistics</h3>
            <div style={row}>
              <div style={inputGroup}>
                <label style={labelStyle}>Date</label>
                <div style={inputWithIcon}>
                  <Calendar size={14} color="#a1a5b7" style={iconInside} />
                  <input required type="date" style={{...inputStyle, paddingLeft: '35px'}} value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />
                </div>
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Time</label>
                <div style={inputWithIcon}>
                  <Clock size={14} color="#a1a5b7" style={iconInside} />
                  <input type="time" style={{...inputStyle, paddingLeft: '35px'}} value={formData.event_time} onChange={e => setFormData({...formData, event_time: e.target.value})} />
                </div>
              </div>
            </div>
            <div style={{...inputGroup, marginTop: '12px'}}>
              <label style={labelStyle}>Venue Location</label>
              <input style={inputStyle} value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} placeholder="e.g. Fairmont Hotel, Vancouver" />
            </div>
          </div>

          {/* SECCIÓN 3: FINANZAS */}
          <div style={{...sectionCard, backgroundColor: '#f8fdfa', border: '1px solid #ccf8e1'}}>
            <h3 style={{...sectionTitle, color: '#50cd89'}}><Wallet size={16} /> Financials (CAD)</h3>
            <div style={row}>
              <div style={inputGroup}>
                <label style={labelStyle}>Total Fee</label>
                <div style={inputWithIcon}>
                  <DollarSign size={14} color="#50cd89" style={iconInside} />
                  <input required type="number" step="0.01" style={{...inputStyle, paddingLeft: '35px', fontWeight: 'bold'}} value={formData.total_amount} onChange={e => setFormData({...formData, total_amount: e.target.value})} />
                </div>
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Deposit Required</label>
                <div style={inputWithIcon}>
                  <DollarSign size={14} color="#a1a5b7" style={iconInside} />
                  <input type="number" step="0.01" style={{...inputStyle, paddingLeft: '35px'}} value={formData.deposit_amount} onChange={e => setFormData({...formData, deposit_amount: e.target.value})} placeholder="0.00" />
                </div>
              </div>
            </div>
          </div>

          {/* BOTONES */}
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={submitBtn}>
              {isSubmitting ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Saving...</span> : 'Generate Quote Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- ESTILOS MEJORADOS UI/UX ---
const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000, padding: '20px' };
const modalStyle = { backgroundColor: 'white', padding: '35px', borderRadius: '24px', width: '100%', maxWidth: '550px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' };

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' };
const iconCircle = { backgroundColor: '#e1f0ff', color: '#009ef7', padding: '12px', borderRadius: '14px' };
const closeBtn = { background: '#f5f5f9', border: 'none', cursor: 'pointer', color: '#a1a5b7', padding: '8px', borderRadius: '50%', display: 'flex', transition: '0.2s' };

const sectionCard = { backgroundColor: '#f9f9fb', padding: '20px', borderRadius: '16px', border: '1px solid #eff2f5' };
const sectionTitle = { fontSize: '14px', fontWeight: '800', color: '#181c32', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };

const labelStyle = { fontSize: '11px', fontWeight: '800', color: '#7e8299', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputGroup = { display: 'flex', flexDirection: 'column', flex: 1 };
const inputStyle = { width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e4e6ef', fontSize: '14px', outline: 'none', backgroundColor: 'white', color: '#181c32', transition: 'border 0.2s', boxSizing: 'border-box', fontFamily: 'inherit' };

const inputWithIcon = { position: 'relative', display: 'flex', alignItems: 'center' };
const iconInside = { position: 'absolute', left: '12px' };
const row = { display: 'flex', gap: '15px' };

const submitBtn = { flex: 2, backgroundColor: '#009ef7', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 12px rgba(0, 158, 247, 0.3)' };
const cancelBtn = { flex: 1, backgroundColor: '#f5f5f9', color: '#7e8299', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: '0.2s' };
const errorBox = { color: '#f1416c', backgroundColor: '#fff5f8', padding: '15px', borderRadius: '12px', fontSize: '13px', marginBottom: '20px', border: '1px solid #f8d7e0', fontWeight: '600' };

export default NewQuoteModal;