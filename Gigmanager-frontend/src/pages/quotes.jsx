import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext'; // 🔥 1. IMPORTAMOS EL CONTEXTO
import { Loader2, Calendar, DollarSign, ChevronDown, ChevronUp, Trash2, Edit, FileText, User, Music, Download, Plus, X, MapPin, Clock, AlignLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import NewQuoteModal from '../components/NewQuoteModal';

const Quotes = () => {
  const { currentUser } = useAuth(); // 🔥 2. EXTRAEMOS TU USUARIO REAL

  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  
  const [quoteToEdit, setQuoteToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({ 
    status: '', total_amount: '', deposit_amount: '', service_name: '', service_description: '', event_date: '', event_time: '', venue: '' 
  });

  const fetchQuotes = () => {
    // 🔥 3. ASEGURAMOS QUE HAYA UN USUARIO ACTIVO
    if (!currentUser) return;

    setIsLoading(true);
    api.get(`/quotes?user_id=${currentUser.uid}`) // 🔥 4. USAMOS EL UID DINÁMICO
      .then(res => {
        setQuotes(res.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching quotes:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchQuotes();
  }, [currentUser]); // 🔥 RECARGA SI EL USUARIO CAMBIA

  const handleDelete = async (e, quote) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(`⚠️ Delete Quote: Are you sure you want to delete ${quote.quote_number}?`);
    if (confirmDelete) {
      try {
        // 🔥 5. ENVIAMOS EL UID REAL PARA BORRAR
        await api.delete(`/quotes/${quote.id}`, { data: { user_id: currentUser.uid } });
        setQuotes(quotes.filter(q => q.id !== quote.id));
      } catch (err) {
        alert("Error deleting quote.");
      }
    }
  };

  const openEditModal = (e, quote) => {
    e.stopPropagation();
    setQuoteToEdit(quote);
    setEditFormData({ 
      status: quote.status || 'Pending', 
      total_amount: quote.total_amount || '',
      deposit_amount: quote.deposit_amount || '',
      service_name: quote.service_name || '',
      service_description: quote.service_description || '',
      event_date: quote.event_date ? quote.event_date.split('T')[0] : '',
      event_time: quote.event_time || '',
      venue: quote.venue || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // 🔥 6. ENVIAMOS EL UID REAL AL EDITAR
      await api.patch(`/quotes/${quoteToEdit.id}`, { 
        user_id: currentUser.uid, 
        ...editFormData,
        total_amount: parseFloat(editFormData.total_amount),
        deposit_amount: editFormData.deposit_amount ? parseFloat(editFormData.deposit_amount) : 0
      });
      setQuoteToEdit(null);
      fetchQuotes(); 
    } catch (err) {
      alert("Error updating quote.");
    }
  };

  const handleStatusChange = async (e, quote, newStatus) => {
    e.stopPropagation();
    try {
      // 🔥 7. ENVIAMOS EL UID REAL AL CAMBIAR EL ESTADO
      await api.patch(`/quotes/${quote.id}`, { user_id: currentUser.uid, status: newStatus });
      fetchQuotes();
    } catch (err) {
      alert("Error updating status.");
    }
  };

  const generatePDF = async (e, quote) => {
    e.stopPropagation();
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById(`pdf-template-${quote.id}`);
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`PROFORMA_${quote.quote_number}_MartinViolinist.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Make sure violin.ico is in the public folder.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return new Date(date.getTime() + Math.abs(date.getTimezoneOffset()*60000)).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'TBD';
    const [hour, minute] = timeString.split(':');
    const d = new Date();
    d.setHours(hour);
    d.setMinutes(minute);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fff8dd', color: '#f6c000', border: '#fbe29f' },
      accepted: { bg: '#e8fff3', color: '#50cd89', border: '#ccf8e1' },
      rejected: { bg: '#fff5f8', color: '#f1416c', border: '#f8d7e0' },
      expired: { bg: '#f9f9f9', color: '#a1a5b7', border: '#eff2f5' }
    };
    const currentStyle = styles[status?.toLowerCase()] || styles.pending;
    return (
      <span style={{ backgroundColor: currentStyle.bg, color: currentStyle.color, border: `1px solid ${currentStyle.border}`, padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <Loader2 className="animate-spin" color="#009ef7" size={40} />
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#f5f5f9', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: '#1e1e2d' }}>Financial Quotes</h1>
          <p style={{ color: '#7e8299', margin: '5px 0 0 0' }}>Track and manage your proformas and proposals.</p>
        </div>
        <button onClick={() => setIsQuoteModalOpen(true)} style={{ backgroundColor: '#009ef7', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Plus size={18} style={{ marginRight: '8px' }} /> Create Quote
        </button>
      </div>

      <div style={{ display: 'flex', padding: '0 25px 10px 25px', fontSize: '12px', fontWeight: '700', color: '#a1a5b7', letterSpacing: '1px' }}>
        <div style={{ flex: 1 }}>QUOTE NO.</div>
        <div style={{ flex: 2 }}>EVENT & CLIENT</div>
        <div style={{ flex: 1 }}>AMOUNT</div>
        <div style={{ flex: 1 }}>STATUS</div>
        <div style={{ flex: 1, textAlign: 'right' }}>ACTIONS</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {quotes.length > 0 ? quotes.map((quote) => (
          <div key={quote.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            
            <div 
              onClick={() => setExpandedId(expandedId === quote.id ? null : quote.id)}
              style={{ padding: '18px 25px', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={iconBoxStyle}><FileText size={18} /></div>
                <div style={{ fontWeight: '800', fontSize: '14px', color: '#009ef7' }}>{quote.quote_number}</div>
              </div>
              
              <div style={{ flex: 2 }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#181c32', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Music size={12} color="#a1a5b7"/> {quote.gig_title}
                </div>
                <div style={{ fontSize: '13px', color: '#7e8299', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <User size={12} /> {quote.first_name} {quote.last_name}
                </div>
              </div>

              <div style={{ flex: 1, fontWeight: '800', fontSize: '15px', color: '#3f4254' }}>
                {formatCurrency(quote.total_amount)}
              </div>

              <div style={{ flex: 1 }}>{getStatusBadge(quote.status)}</div>
              
              <div style={{ flex: 1, display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'flex-end' }}>
                <button onClick={(e) => openEditModal(e, quote)} style={actionBtnStyle} title="Edit Quote"><Edit size={16} color="#666" /></button>
                <button onClick={(e) => handleDelete(e, quote)} style={actionBtnStyle} title="Delete Quote"><Trash2 size={16} color="#ef4444" /></button>
                <div style={{ borderLeft: '1px solid #eee', height: '20px', margin: '0 5px' }}></div>
                {expandedId === quote.id ? <ChevronUp size={20} color="#009ef7"/> : <ChevronDown size={20} color="#999" />}
              </div>
            </div>

            {expandedId === quote.id && (
              <div style={{ padding: '20px 25px 20px 80px', backgroundColor: '#f9f9fb', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px' }}>
                  <div>
                    <p style={labelStyle}><Calendar size={12} /> Event Date</p>
                    <p style={textStyle}><b>{formatDate(quote.event_date)}</b></p>
                  </div>
                  <div>
                    <p style={labelStyle}>Quick Actions</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                      <button onClick={(e) => handleStatusChange(e, quote, 'Accepted')} style={acceptBtn}>Accept</button>
                      <button onClick={(e) => handleStatusChange(e, quote, 'Rejected')} style={rejectBtn}>Reject</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <button onClick={(e) => generatePDF(e, quote)} style={pdfBtn} disabled={isGeneratingPdf}>
                      {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 📑 PLANTILLA OCULTA DEL PDF */}
            <div style={offScreenStyle} id={`pdf-template-${quote.id}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #181c32', paddingBottom: '30px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <img src="/violin.ico" alt="Martin Violinist Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                  <div>
                    <h1 style={{ fontSize: '36px', margin: '0 0 2px 0', color: '#181c32', fontFamily: 'Georgia, serif', letterSpacing: '-0.5px' }}>Martin Violinist</h1>
                    <p style={{ margin: 0, color: '#7e8299', fontSize: '13px', letterSpacing: '2px', fontWeight: 'bold' }}>BC - CANADA</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '28px', margin: '0 0 8px 0', color: '#181c32', fontWeight: '900', letterSpacing: '1px' }}>PROFORMA INVOICE</h2>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#3f4254' }}><b>Quote No:</b> {quote.quote_number}</p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#3f4254' }}><b>Date of Issue:</b> {formatDate(new Date().toISOString())}</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#7e8299' }}><b>Valid Until:</b> {formatDate(quote.valid_until)}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', color: '#181c32', textTransform: 'uppercase', borderBottom: '1px solid #e4e6ef', paddingBottom: '8px', marginBottom: '15px' }}>Bill To / Client</h3>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#181c32', fontSize: '16px' }}>{quote.first_name} {quote.last_name}</p>
                  <p style={{ margin: '5px 0 0 0', color: '#7e8299', fontSize: '14px' }}>{quote.email}</p>
                </div>
                
                <div>
                  <h3 style={{ fontSize: '14px', color: '#181c32', textTransform: 'uppercase', borderBottom: '1px solid #e4e6ef', paddingBottom: '8px', marginBottom: '15px' }}>Event Logistics</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '8px', fontSize: '14px', color: '#3f4254' }}>
                    <b>Date:</b> <span>{formatDate(quote.event_date)}</span>
                    <b>Time:</b> <span>{formatTime(quote.event_time)}</span>
                    <b>Venue:</b> <span>{quote.venue || 'To Be Determined'}</span>
                  </div>
                </div>
              </div>

              <div style={{ width: '100%', border: '1px solid #e4e6ef', borderRadius: '4px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', backgroundColor: '#f5f5f9', padding: '15px 20px', color: '#181c32', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid #e4e6ef' }}>
                  <div style={{ flex: 3 }}>Description of Services</div>
                  <div style={{ flex: 1, textAlign: 'right' }}>Amount</div>
                </div>
                <div style={{ display: 'flex', padding: '25px 20px', fontSize: '15px', color: '#3f4254' }}>
                  <div style={{ flex: 3, paddingRight: '20px' }}>
                    <b style={{ color: '#181c32', fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                      {quote.service_name || 'Professional Live Violin Performance'}
                    </b>
                    <p style={{ margin: 0, fontSize: '13px', color: '#7e8299', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {quote.service_description || 'Musical performance services for the event detailed above. Rate includes preparation, instrument maintenance, travel, and live performance execution.'}
                    </p>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>
                    {formatCurrency(quote.total_amount)}
                  </div>
                </div>
              </div>
                
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '50px' }}>
                <div style={{ width: '350px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '15px', color: '#3f4254', borderBottom: '1px solid #e4e6ef' }}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(quote.total_amount)}</span>
                  </div>
                  {parseFloat(quote.deposit_amount) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '15px', color: '#3f4254', borderBottom: '1px solid #e4e6ef' }}>
                      <span>Required Deposit</span>
                      <span>{formatCurrency(quote.deposit_amount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', fontSize: '18px', color: '#181c32', fontWeight: '900' }}>
                    <span>Balance Due</span>
                    <span>{formatCurrency(parseFloat(quote.total_amount) - (parseFloat(quote.deposit_amount) || 0))}</span>
                  </div>
                </div>
              </div>

              <div style={{ color: '#7e8299', fontSize: '12px', lineHeight: '1.6' }}>
                <h4 style={{ color: '#181c32', fontSize: '13px', textTransform: 'uppercase', marginBottom: '5px' }}>Terms & Conditions</h4>
                <p style={{ margin: '0 0 15px 0' }}>This document is a proforma invoice. The booking is only confirmed once the required deposit is received. The remaining balance is due on or before the event date as specified above.</p>
                
                <div style={{ borderTop: '2px solid #e4e6ef', paddingTop: '20px', marginTop: '40px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#181c32', fontSize: '14px' }}>Thank you for choosing Martin Violinist for your special event.</p>
                  <p style={{ margin: '5px 0 0 0' }}>If you have any questions concerning this quote, please contact me directly.</p>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #e4e6ef' }}>
            <FileText size={40} color="#d8d8e5" style={{ margin: '0 auto 15px auto' }} />
            <h3 style={{ color: '#1e1e2d', marginBottom: '5px' }}>No quotes generated yet</h3>
          </div>
        )}
      </div>

      <NewQuoteModal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} onQuoteAdded={fetchQuotes} initialData={null} />

      {/* 🔥 MODAL DE EDICIÓN */}
      {quoteToEdit && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Edit Quote #{quoteToEdit.quote_number}</h2>
              <button onClick={() => setQuoteToEdit(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#a1a5b7" /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}><AlignLeft size={12}/> Service Name</label>
                <input style={inputStyle} value={editFormData.service_name} onChange={e => setEditFormData({...editFormData, service_name: e.target.value})} placeholder="e.g. Wedding Ceremony Package" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}><AlignLeft size={12}/> Service Description</label>
                <textarea style={{...inputStyle, minHeight: '60px', resize: 'vertical'}} value={editFormData.service_description} onChange={e => setEditFormData({...editFormData, service_description: e.target.value})} placeholder="What's included?" />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <label style={labelStyle}><Calendar size={12}/> Event Date</label>
                  <input type="date" style={inputStyle} value={editFormData.event_date} onChange={e => setEditFormData({...editFormData, event_date: e.target.value})} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <label style={labelStyle}><Clock size={12}/> Time</label>
                  <input type="time" style={inputStyle} value={editFormData.event_time} onChange={e => setEditFormData({...editFormData, event_time: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}><MapPin size={12}/> Venue</label>
                <input style={inputStyle} value={editFormData.venue} onChange={e => setEditFormData({...editFormData, venue: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <label style={labelStyle}>Total Amount (CAD)</label>
                  <input type="number" step="0.01" style={inputStyle} value={editFormData.total_amount} onChange={e => setEditFormData({...editFormData, total_amount: e.target.value})} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <label style={labelStyle}>Deposit Required</label>
                  <input type="number" step="0.01" style={inputStyle} value={editFormData.deposit_amount} onChange={e => setEditFormData({...editFormData, deposit_amount: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                  <option value="Pending">Pending</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <button type="submit" style={{ ...pdfBtn, justifyContent: 'center', marginTop: '10px' }}>Save Changes</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// --- ESTILOS ---
const iconBoxStyle = { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e1f0ff', color: '#009ef7', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const labelStyle = { fontSize: '10px', fontWeight: '800', color: '#a1a5b7', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px' };
const textStyle = { fontSize: '14px', margin: '2px 0', color: '#3f4254', lineHeight: '1.5' };
const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', transition: 'background 0.2s' };
const acceptBtn = { backgroundColor: '#e8fff3', color: '#50cd89', border: '1px solid #ccf8e1', padding: '8px 15px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const rejectBtn = { backgroundColor: '#fff5f8', color: '#f1416c', border: '1px solid #f8d7e0', padding: '8px 15px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const pdfBtn = { backgroundColor: '#181c32', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' };

const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(24, 28, 50, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 };
const modalStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e4e6ef', fontSize: '14px', outline: 'none', backgroundColor: '#f9f9fb', boxSizing: 'border-box', fontFamily: 'inherit' };

const offScreenStyle = {
  position: 'absolute',
  top: '-10000px',
  left: '-10000px',
  width: '800px', 
  padding: '60px',
  backgroundColor: 'white',
  color: '#1e1e2d',
  fontFamily: 'Arial, sans-serif'
};

export default Quotes;