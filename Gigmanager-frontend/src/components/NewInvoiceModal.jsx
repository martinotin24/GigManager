import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { X, FileText, Calendar, DollarSign, Music, Briefcase, Wallet, FileCheck, AlignLeft } from 'lucide-react';

const NewInvoiceModal = ({ isOpen, onClose, onInvoiceAdded }) => {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    gig_id: '',
    quote_id: '',
    invoice_number: '',
    issued_date: '',
    due_date: '',
    total_amount: '',
    notes: '', 
    status: 'Unpaid'
  });
  
  const [sourceType, setSourceType] = useState('gig'); 
  const [gigsList, setGigsList] = useState([]);
  const [quotesList, setQuotesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setIsLoading(true);
      Promise.all([
        api.get(`/gigs?user_id=${currentUser.uid}`),
        api.get(`/quotes?user_id=${currentUser.uid}`)
      ])
      .then(([gigsRes, quotesRes]) => {
        setGigsList(gigsRes.data);
        setQuotesList(quotesRes.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        setIsLoading(false);
      });

      const randomId = Math.floor(1000 + Math.random() * 9000);
      const today = new Date();
      const due = new Date();
      due.setDate(today.getDate() + 14);

      setFormData({
        gig_id: '', 
        quote_id: '',
        invoice_number: `INV-${today.getFullYear()}-${randomId}`,
        issued_date: today.toISOString().split('T')[0],
        due_date: due.toISOString().split('T')[0],
        total_amount: '', 
        notes: 'Final billing for musical performance and related services.',
        status: 'Unpaid'
      });
      setError(null);
    }
  }, [isOpen, currentUser]);

  const handleGigSelection = (e) => {
    const selectedGigId = e.target.value;
    const selectedGig = gigsList.find(g => g.id === parseInt(selectedGigId));
    
    setFormData({
      ...formData,
      gig_id: selectedGigId,
      quote_id: '', 
      total_amount: selectedGig ? selectedGig.fee : '',
      notes: 'Final billing for musical performance and related services.'
    });
  };

  const handleQuoteSelection = (e) => {
    const selectedQuoteId = e.target.value;
    const selectedQuote = quotesList.find(q => q.id === parseInt(selectedQuoteId));
    
    let balance = '';
    if (selectedQuote) {
      const total = parseFloat(selectedQuote.total_amount) || 0;
      const deposit = parseFloat(selectedQuote.deposit_amount) || 0;
      balance = (total - deposit).toFixed(2);
    }

    setFormData({
      ...formData,
      quote_id: selectedQuoteId,
      gig_id: selectedQuote ? selectedQuote.gig_id : '',
      total_amount: balance,
      notes: selectedQuote ? `Balance due for Quote #${selectedQuote.quote_number} (${selectedQuote.service_name || 'Service'})` : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.gig_id) throw new Error("Please select an event or quote to bill.");

      await api.post('/invoices', { 
        ...formData, 
        user_id: currentUser.uid, 
        total_amount: parseFloat(formData.total_amount) 
      });
      
      if (onInvoiceAdded) onInvoiceAdded(); 
      onClose();
    } catch (err) {
      console.error(err);
      // ✅ Corrección: Ahora setError guarda el mensaje, y abajo lo mostramos en un div
      setError(err.response?.data?.error || err.message || "Failed to create invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={iconCircle}><FileText size={24} /></div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 4px 0', color: '#181c32' }}>Generate Invoice</h2>
              <p style={{ fontSize: '12px', color: '#7e8299', margin: 0, fontWeight: '600' }}>Create a new professional bill</p>
            </div>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={22} /></button>
        </div>

        {/* ✅ Corrección: Ahora usamos el estilo errorBoxStyle definido abajo */}
        {error && <div style={errorBoxStyle}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '10px', backgroundColor: '#f5f5f9', padding: '5px', borderRadius: '12px' }}>
            <div 
              onClick={() => { setSourceType('gig'); setFormData({...formData, quote_id: '', gig_id: '', total_amount: ''}); }}
              style={{ ...tabStyle, backgroundColor: sourceType === 'gig' ? 'white' : 'transparent', color: sourceType === 'gig' ? '#009ef7' : '#7e8299', boxShadow: sourceType === 'gig' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
            >
              <Music size={14} /> Bill from Event
            </div>
            <div 
              onClick={() => { setSourceType('quote'); setFormData({...formData, quote_id: '', gig_id: '', total_amount: ''}); }}
              style={{ ...tabStyle, backgroundColor: sourceType === 'quote' ? 'white' : 'transparent', color: sourceType === 'quote' ? '#009ef7' : '#7e8299', boxShadow: sourceType === 'quote' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
            >
              <FileCheck size={14} /> Bill from Quote
            </div>
          </div>

          <div style={{...sectionCard, border: '1px solid #009ef7', backgroundColor: '#f1faff'}}>
            {sourceType === 'gig' ? (
              <>
                <label style={{...labelStyle, color: '#009ef7'}}>Select Event to Bill</label>
                <select required style={selectStyle} value={formData.gig_id} onChange={handleGigSelection} disabled={isLoading}>
                  <option value="" disabled>{isLoading ? 'Loading...' : '-- Select an existing Gig --'}</option>
                  {gigsList.map(g => (
                    <option key={g.id} value={g.id}>{g.title} | {g.client_first_name} {g.client_last_name}</option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <label style={{...labelStyle, color: '#009ef7'}}>Select Approved Quote</label>
                <select required style={selectStyle} value={formData.quote_id} onChange={handleQuoteSelection} disabled={isLoading}>
                  <option value="" disabled>{isLoading ? 'Loading...' : '-- Select an existing Quote --'}</option>
                  {quotesList.map(q => (
                    <option key={q.id} value={q.id}>
                      #{q.quote_number} | {q.gig_title} ({q.status})
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div style={sectionCard}>
            <h3 style={sectionTitle}><Briefcase size={16} /> Invoice Details</h3>
            
            <div style={inputGroup}>
              <label style={labelStyle}><AlignLeft size={12}/> Invoice Description</label>
              <textarea required style={{...inputStyle, minHeight: '50px', resize: 'vertical'}} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
              <div style={inputGroup}>
                <label style={labelStyle}>Issue Date</label>
                <div style={inputWithIcon}>
                  <Calendar size={14} color="#a1a5b7" style={iconInside} />
                  <input required type="date" style={{...inputStyle, paddingLeft: '35px'}} value={formData.issued_date} onChange={e => setFormData({...formData, issued_date: e.target.value})} />
                </div>
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Due Date</label>
                <div style={inputWithIcon}>
                  <Calendar size={14} color="#f1416c" style={iconInside} />
                  <input required type="date" style={{...inputStyle, paddingLeft: '35px'}} value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <div style={{...sectionCard, backgroundColor: '#f8fdfa', border: '1px solid #ccf8e1'}}>
            <h3 style={{...sectionTitle, color: '#50cd89'}}><Wallet size={16} /> Total Due</h3>
            <div style={inputGroup}>
              <div style={inputWithIcon}>
                <DollarSign size={16} color="#50cd89" style={iconInside} />
                <input required type="number" step="0.01" style={{...inputStyle, paddingLeft: '35px', fontWeight: '900', fontSize: '18px', color: '#181c32'}} value={formData.total_amount} onChange={e => setFormData({...formData, total_amount: e.target.value})} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={submitBtn}>
              {isSubmitting ? 'Saving...' : 'Generate Invoice Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- ESTILOS ---
const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000, padding: '20px' };
const modalStyle = { backgroundColor: 'white', padding: '35px', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' };
const iconCircle = { backgroundColor: '#e1f0ff', color: '#009ef7', padding: '12px', borderRadius: '14px' };
const closeBtn = { background: '#f5f5f9', border: 'none', cursor: 'pointer', color: '#a1a5b7', padding: '8px', borderRadius: '50%', display: 'flex', transition: '0.2s' };
const tabStyle = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' };
const sectionCard = { backgroundColor: '#f9f9fb', padding: '20px', borderRadius: '16px', border: '1px solid #eff2f5' };
const sectionTitle = { fontSize: '14px', fontWeight: '800', color: '#181c32', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' };
const labelStyle = { fontSize: '11px', fontWeight: '800', color: '#7e8299', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' };
const inputGroup = { display: 'flex', flexDirection: 'column', flex: 1 };
const inputStyle = { width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e4e6ef', fontSize: '14px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', fontFamily: 'inherit' };
const selectStyle = { ...inputStyle, border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const inputWithIcon = { position: 'relative', display: 'flex', alignItems: 'center' };
const iconInside = { position: 'absolute', left: '12px' };
const submitBtn = { flex: 2, backgroundColor: '#009ef7', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer' };
const cancelBtn = { flex: 1, backgroundColor: '#f5f5f9', color: '#7e8299', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' };

// ✅ Nuevo estilo para el cuadro de error
const errorBoxStyle = {
  backgroundColor: '#fff5f8',
  color: '#f1416c',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #f1416c',
  marginBottom: '20px',
  fontSize: '13px',
  fontWeight: '600'
};

export default NewInvoiceModal;