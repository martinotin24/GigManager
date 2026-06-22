import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext'; // 🔥 1. IMPORTAMOS EL CONTEXTO
import { Plus, Loader2, Calendar, MapPin, DollarSign, ChevronDown, ChevronUp, Trash2, Edit, Music, User } from 'lucide-react';
import NewGigModal from '../components/NewGigModal';
import NewQuoteModal from '../components/NewQuoteModal'; 

const Gigs = () => {
  const { currentUser } = useAuth(); // 🔥 2. OBTENEMOS AL USUARIO ACTUAL
  const [gigs, setGigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [gigToEdit, setGigToEdit] = useState(null);
  
  const [quotePromptData, setQuotePromptData] = useState(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false); 

  const fetchGigs = () => {
    // Si no hay usuario, no intentamos pedir datos
    if (!currentUser) return;

    setIsLoading(true);
    // 🔥 3. USAMOS EL UID DINÁMICO
    api.get(`/gigs?user_id=${currentUser.uid}`)
      .then(res => {
        setGigs(res.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching gigs:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchGigs();
  }, [currentUser]); // 🔥 RECARGA SI EL USUARIO CAMBIA

  const handleDelete = async (e, gig) => {
    e.stopPropagation();
    
    const confirmDelete = window.confirm(
      `⚠️ Delete Gig: Are you sure you want to delete "${gig.title}"?\n\nThis action cannot be undone.`
    );

    if (confirmDelete) {
      try {
        // 🔥 4. ENVIAMOS EL UID REAL PARA LA ELIMINACIÓN
        await api.delete(`/gigs/${gig.id}`, { data: { user_id: currentUser.uid } });
        setGigs(gigs.filter(g => g.id !== gig.id));
      } catch (err) {
        alert("Error deleting gig. Please try again.");
      }
    }
  };

  const handleEdit = (e, gig) => {
    e.stopPropagation(); 
    setGigToEdit(gig); 
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setGigToEdit(null); 
    setIsModalOpen(true);
  };

  const handlePromptQuote = (quoteData) => {
    setQuotePromptData(quoteData);
  };

  // --- Helpers ---
  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fff5f8', color: '#f1416c', border: '#f8d7e0' },
      confirmed: { bg: '#f1faff', color: '#009ef7', border: '#dcf1ff' },
      completed: { bg: '#e8fff3', color: '#50cd89', border: '#ccf8e1' },
      cancelled: { bg: '#f9f9f9', color: '#a1a5b7', border: '#eff2f5' }
    };
    const currentStyle = styles[status?.toLowerCase()] || styles.pending;
    return (
      <span style={{ 
        backgroundColor: currentStyle.bg, 
        color: currentStyle.color, 
        border: `1px solid ${currentStyle.border}`,
        padding: '4px 10px', 
        borderRadius: '6px', 
        fontSize: '11px', 
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <Loader2 className="animate-spin" color="#7239ea" size={40} />
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#f5f5f9', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: '#1e1e2d' }}>Gigs & Events</h1>
          <p style={{ color: '#7e8299', margin: '5px 0 0 0' }}>Manage your upcoming performances and bookings.</p>
        </div>
        <button 
          onClick={handleAddNew} 
          style={{ backgroundColor: '#7239ea', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Plus size={18} style={{ marginRight: '8px' }} /> Create Gig
        </button>
      </div>

      {/* LIST HEADERS */}
      <div style={{ display: 'flex', padding: '0 25px 10px 25px', fontSize: '12px', fontWeight: '700', color: '#a1a5b7', letterSpacing: '1px' }}>
        <div style={{ flex: 2 }}>EVENT DETAILS</div>
        <div style={{ flex: 1.5 }}>CLIENT</div>
        <div style={{ flex: 1 }}>STATUS</div>
        <div style={{ flex: 1, textAlign: 'right' }}>ACTIONS</div>
      </div>

      {/* GIGS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {gigs.length > 0 ? gigs.map((gig) => (
          <div key={gig.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div 
              onClick={() => setExpandedId(expandedId === gig.id ? null : gig.id)}
              style={{ padding: '18px 25px', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={iconBoxStyle}><Music size={18} /></div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '15px', color: '#181c32', marginBottom: '4px' }}>{gig.title}</div>
                  <div style={{ fontSize: '13px', color: '#7e8299', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={12} /> {formatDate(gig.event_date)}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1.5, color: '#4b5675', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} color="#a1a5b7" />
                {gig.client_first_name} {gig.client_last_name}
              </div>
              <div style={{ flex: 1 }}>{getStatusBadge(gig.status)}</div>
              <div style={{ flex: 1, display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'flex-end' }}>
                <button onClick={(e) => handleEdit(e, gig)} style={actionBtnStyle} title="Edit Gig">
                  <Edit size={16} color="#666" />
                </button>
                <button onClick={(e) => handleDelete(e, gig)} style={actionBtnStyle} title="Delete Gig">
                  <Trash2 size={16} color="#ef4444" />
                </button>
                <div style={{ borderLeft: '1px solid #eee', height: '20px', margin: '0 5px' }}></div>
                {expandedId === gig.id ? <ChevronUp size={20} color="#7239ea"/> : <ChevronDown size={20} color="#999" />}
              </div>
            </div>
            {expandedId === gig.id && (
              <div style={{ padding: '20px 25px 20px 80px', backgroundColor: '#f9f9fb', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  <div>
                    <p style={labelStyle}>Description & Requirements</p>
                    <p style={textStyle}>{gig.description || <span style={{ color: '#a1a5b7', fontStyle: 'italic' }}>No additional details provided.</span>}</p>
                  </div>
                  <div>
                    <div style={{ marginBottom: '15px' }}>
                      <p style={labelStyle}><MapPin size={12} /> Venue Location</p>
                      <p style={textStyle}>{gig.venue || 'TBD'}</p>
                    </div>
                    <div>
                      <p style={labelStyle}><DollarSign size={12} /> Agreed Fee</p>
                      <p style={{ ...textStyle, color: '#50cd89', fontWeight: '800', fontSize: '16px' }}>{formatCurrency(gig.fee)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #e4e6ef' }}>
            <Music size={40} color="#d8d8e5" style={{ margin: '0 auto 15px auto' }} />
            <h3 style={{ color: '#1e1e2d', marginBottom: '5px' }}>No gigs scheduled</h3>
            <p style={{ color: '#a1a5b7' }}>Click "Create Gig" to add your first performance.</p>
          </div>
        )}
      </div>

      <NewGigModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setGigToEdit(null);
        }} 
        onGigAdded={fetchGigs} 
        gigToEdit={gigToEdit}
        onPromptQuote={handlePromptQuote}
      />

      {quotePromptData && (
        <div style={promptOverlayStyle}>
          <div style={promptBoxStyle}>
            <div style={successIconStyle}>🎉</div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 10px 0', color: '#181c32' }}>Gig Created!</h2>
            <p style={{ color: '#7e8299', fontSize: '14px', margin: '0 0 25px 0', lineHeight: '1.5' }}>
              Your event has been successfully scheduled. Would you like to generate a professional <b>Quote</b> for this client right now?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setQuotePromptData(null)} style={promptCancelBtn}>Not Right Now</button>
              <button onClick={() => setIsQuoteModalOpen(true)} style={promptAcceptBtn}>Generate Quote</button>
            </div>
          </div>
        </div>
      )}

      <NewQuoteModal 
        isOpen={isQuoteModalOpen} 
        onClose={() => {
          setIsQuoteModalOpen(false);
          setQuotePromptData(null);
        }}
        initialData={quotePromptData}
      />
    </div>
  );
};

// --- ESTILOS ---
const iconBoxStyle = { width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#f1f1f4', color: '#7239ea', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const labelStyle = { fontSize: '10px', fontWeight: '800', color: '#a1a5b7', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px' };
const textStyle = { fontSize: '14px', margin: '2px 0', color: '#3f4254', lineHeight: '1.5' };
const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', transition: 'background 0.2s' };
const promptOverlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10500, backdropFilter: 'blur(3px)' };
const promptBoxStyle = { backgroundColor: 'white', padding: '35px', borderRadius: '20px', width: '90%', maxWidth: '380px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', textAlign: 'center' };
const successIconStyle = { fontSize: '40px', marginBottom: '15px' };
const promptCancelBtn = { flex: 1, backgroundColor: '#f1f1f4', color: '#7e8299', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' };
const promptAcceptBtn = { flex: 1, backgroundColor: '#50cd89', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 10px rgba(80, 205, 137, 0.3)' };

export default Gigs;