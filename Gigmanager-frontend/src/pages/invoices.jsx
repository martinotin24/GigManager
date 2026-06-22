import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext'; // 🔥 1. IMPORTAMOS EL CONTEXTO
import { Loader2, Calendar, ChevronDown, ChevronUp, Trash2, Edit, FileText, User, Music, Download, Plus, X, AlignLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import NewInvoiceModal from '../components/NewInvoiceModal';

const Invoices = () => {
  const { currentUser } = useAuth(); // 🔥 2. EXTRAEMOS TU USUARIO REAL

  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [invoiceToEdit, setInvoiceToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({ status: '', total_amount: '', due_date: '', notes: '' });

  const fetchInvoices = () => {
    // 🔥 3. ASEGURAMOS QUE HAY USUARIO LOGUEADO
    if (!currentUser) return;

    setIsLoading(true);
    api.get(`/invoices?user_id=${currentUser.uid}`) // 🔥 4. USAMOS EL UID
      .then(res => { setInvoices(res.data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => { fetchInvoices(); }, [currentUser]); // 🔥 RECARGA AL CAMBIAR USUARIO

  const handleDelete = async (e, invoice) => {
    e.stopPropagation();
    if (window.confirm(`Delete Invoice ${invoice.invoice_number}?`)) {
      try {
        // 🔥 5. ENVIAMOS EL UID REAL AL BORRAR
        await api.delete(`/invoices/${invoice.id}`, { data: { user_id: currentUser.uid } });
        setInvoices(invoices.filter(i => i.id !== invoice.id));
      } catch (err) { alert("Error deleting invoice."); }
    }
  };

  const openEditModal = (e, invoice) => {
    e.stopPropagation();
    setInvoiceToEdit(invoice);
    setEditFormData({ 
      status: invoice.status, 
      total_amount: invoice.total_amount,
      due_date: invoice.due_date ? invoice.due_date.split('T')[0] : '',
      notes: invoice.notes || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // 🔥 6. ENVIAMOS EL UID REAL AL EDITAR
      await api.patch(`/invoices/${invoiceToEdit.id}`, { 
        user_id: currentUser.uid, 
        ...editFormData,
        total_amount: parseFloat(editFormData.total_amount)
      });
      setInvoiceToEdit(null);
      fetchInvoices(); 
    } catch (err) { alert("Error updating invoice."); }
  };

  const generatePDF = async (e, invoice) => {
    e.stopPropagation();
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById(`pdf-template-${invoice.id}`);
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`INVOICE_${invoice.invoice_number}_MartinViolinist.pdf`);
    } catch (error) {
      alert("Failed to generate PDF. Make sure violin.ico is in public folder.");
    } finally { setIsGeneratingPdf(false); }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return new Date(date.getTime() + Math.abs(date.getTimezoneOffset()*60000)).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount || 0);

  const getStatusBadge = (status) => {
    const styles = {
      unpaid: { bg: '#fff8dd', color: '#f6c000', border: '#fbe29f' },
      paid: { bg: '#e8fff3', color: '#50cd89', border: '#ccf8e1' },
      overdue: { bg: '#fff5f8', color: '#f1416c', border: '#f8d7e0' },
      cancelled: { bg: '#f9f9f9', color: '#a1a5b7', border: '#eff2f5' }
    };
    const currentStyle = styles[status?.toLowerCase()] || styles.unpaid;
    return (
      <span style={{ backgroundColor: currentStyle.bg, color: currentStyle.color, border: `1px solid ${currentStyle.border}`, padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
        {status}
      </span>
    );
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}><Loader2 className="animate-spin" color="#009ef7" size={40} /></div>;

  return (
    <div style={{ padding: '40px', backgroundColor: '#f5f5f9', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: '#1e1e2d' }}>Invoices & Billing</h1>
          <p style={{ color: '#7e8299', margin: '5px 0 0 0' }}>Manage your payments and receipts.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ backgroundColor: '#009ef7', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Plus size={18} style={{ marginRight: '8px' }} /> Create Invoice
        </button>
      </div>

      <div style={{ display: 'flex', padding: '0 25px 10px 25px', fontSize: '12px', fontWeight: '700', color: '#a1a5b7', letterSpacing: '1px' }}>
        <div style={{ flex: 1 }}>INVOICE NO.</div>
        <div style={{ flex: 2 }}>EVENT & CLIENT</div>
        <div style={{ flex: 1 }}>AMOUNT DUE</div>
        <div style={{ flex: 1 }}>STATUS</div>
        <div style={{ flex: 1, textAlign: 'right' }}>ACTIONS</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {invoices.length > 0 ? invoices.map((invoice) => (
          <div key={invoice.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            
            <div 
              onClick={() => setExpandedId(expandedId === invoice.id ? null : invoice.id)}
              style={{ padding: '18px 25px', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={iconBoxStyle}><FileText size={18} /></div>
                <div style={{ fontWeight: '800', fontSize: '14px', color: '#009ef7' }}>{invoice.invoice_number}</div>
              </div>
              
              <div style={{ flex: 2 }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#181c32', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Music size={12} color="#a1a5b7"/> {invoice.gig_title}
                </div>
                <div style={{ fontSize: '13px', color: '#7e8299', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <User size={12} /> {invoice.first_name} {invoice.last_name}
                </div>
              </div>

              <div style={{ flex: 1, fontWeight: '800', fontSize: '15px', color: '#3f4254' }}>
                {formatCurrency(invoice.total_amount)}
              </div>

              <div style={{ flex: 1 }}>{getStatusBadge(invoice.status)}</div>
              
              <div style={{ flex: 1, display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'flex-end' }}>
                <button onClick={(e) => openEditModal(e, invoice)} style={actionBtnStyle} title="Edit Invoice"><Edit size={16} color="#666" /></button>
                <button onClick={(e) => handleDelete(e, invoice)} style={actionBtnStyle} title="Delete Invoice"><Trash2 size={16} color="#ef4444" /></button>
                <div style={{ borderLeft: '1px solid #eee', height: '20px', margin: '0 5px' }}></div>
                {expandedId === invoice.id ? <ChevronUp size={20} color="#009ef7"/> : <ChevronDown size={20} color="#999" />}
              </div>
            </div>

            {expandedId === invoice.id && (
              <div style={{ padding: '20px 25px 20px 80px', backgroundColor: '#f9f9fb', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  <div>
                    <p style={labelStyle}><Calendar size={12} /> Due Date</p>
                    <p style={{ fontSize: '14px', margin: '2px 0', color: invoice.status === 'Overdue' ? '#f1416c' : '#3f4254', fontWeight: 'bold' }}>
                      {formatDate(invoice.due_date)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <button onClick={(e) => generatePDF(e, invoice)} style={pdfBtn} disabled={isGeneratingPdf}>
                      {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      {isGeneratingPdf ? 'Generating...' : 'Download Invoice PDF'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 📑 PLANTILLA OCULTA DEL PDF - PREMIUM INVOICE */}
            <div style={offScreenStyle} id={`pdf-template-${invoice.id}`}>
              
              {/* Sellos de agua */}
              {invoice.status === 'Paid' && (
                <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)', color: 'rgba(80, 205, 137, 0.12)', border: '12px solid rgba(80, 205, 137, 0.12)', padding: '20px 50px', fontSize: '90px', fontWeight: '900', letterSpacing: '15px', textTransform: 'uppercase', borderRadius: '25px', zIndex: 0 }}>PAID</div>
              )}
              {invoice.status === 'Overdue' && (
                <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)', color: 'rgba(241, 65, 108, 0.12)', border: '12px solid rgba(241, 65, 108, 0.12)', padding: '20px 50px', fontSize: '90px', fontWeight: '900', letterSpacing: '15px', textTransform: 'uppercase', borderRadius: '25px', zIndex: 0 }}>OVERDUE</div>
              )}

              <div style={{ position: 'relative', zIndex: 1 }}>
                
                {/* Header Block */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <img src="/violin.ico" alt="Logo" style={{ width: '85px', height: '85px', objectFit: 'contain' }} />
                    <div>
                      <h1 style={{ fontSize: '40px', margin: '0 0 5px 0', color: '#181c32', fontFamily: 'Georgia, serif', letterSpacing: '-0.5px' }}>Martin Violinist</h1>
                      <p style={{ margin: 0, color: '#7e8299', fontSize: '14px', letterSpacing: '1px', fontWeight: 'bold' }}>PROFESSIONAL LIVE MUSIC</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '45px', margin: '0 0 10px 0', color: '#181c32', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>Invoice</h2>
                    <p style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#3f4254' }}><b>No:</b> {invoice.invoice_number}</p>
                    <p style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#3f4254' }}><b>Date:</b> {formatDate(invoice.issued_date)}</p>
                  </div>
                </div>

                <div style={{ width: '100%', height: '2px', backgroundColor: '#e4e6ef', marginBottom: '40px' }}></div>

                {/* From / To Block */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', marginBottom: '50px' }}>
                  <div>
                    <h3 style={{ fontSize: '13px', color: '#a1a5b7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>From</h3>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#181c32', fontSize: '18px', marginBottom: '5px' }}>Martin Violinist</p>
                    <p style={{ margin: 0, color: '#7e8299', fontSize: '15px', lineHeight: '1.6' }}>
                      Surrey, British Columbia<br/>
                      Canada<br/>
                    </p>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '13px', color: '#a1a5b7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Bill To</h3>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#181c32', fontSize: '18px', marginBottom: '5px' }}>{invoice.first_name} {invoice.last_name}</p>
                    <p style={{ margin: 0, color: '#7e8299', fontSize: '15px', lineHeight: '1.6' }}>
                      {invoice.email}<br/>
                      Event: <b>{invoice.gig_title}</b>
                    </p>
                  </div>
                </div>

                {/* Main Table */}
                <div style={{ width: '100%', border: '1px solid #e4e6ef', borderRadius: '8px', overflow: 'hidden', marginBottom: '30px' }}>
                  <div style={{ display: 'flex', backgroundColor: '#f9f9fb', padding: '15px 25px', color: '#a1a5b7', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #e4e6ef' }}>
                    <div style={{ flex: 3 }}>Description</div>
                    <div style={{ flex: 1, textAlign: 'center' }}>Qty</div>
                    <div style={{ flex: 1, textAlign: 'right' }}>Total</div>
                  </div>
                  
                  <div style={{ display: 'flex', padding: '30px 25px', fontSize: '16px', color: '#181c32', borderBottom: '1px solid #e4e6ef' }}>
                    <div style={{ flex: 3, paddingRight: '30px' }}>
                      <b style={{ display: 'block', marginBottom: '8px' }}>Professional Live Violin Services</b>
                      <p style={{ margin: 0, fontSize: '14px', color: '#7e8299', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {invoice.notes || 'Final billing for musical performance and related services rendered for the referenced event.'}
                      </p>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', color: '#7e8299' }}>1</div>
                    <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(invoice.total_amount)}</div>
                  </div>

                  <div style={{ display: 'flex', padding: '20px 25px', backgroundColor: '#fafafa' }}>
                    <div style={{ flex: 3 }}></div>
                    <div style={{ flex: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '16px', color: '#3f4254' }}>
                        <span>Subtotal</span>
                        <span>{formatCurrency(invoice.total_amount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', fontSize: '22px', color: '#181c32', fontWeight: '900', borderTop: '2px solid #e4e6ef', marginTop: '5px' }}>
                        <span>Total Due</span>
                        <span>{formatCurrency(invoice.total_amount)}</span>
                      </div>
                      {invoice.status === 'Paid' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '16px', color: '#50cd89', fontWeight: 'bold' }}>
                          <span>Amount Paid</span>
                          <span>{formatCurrency(invoice.total_amount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Notes */}
                <div style={{ marginTop: '50px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ maxWidth: '60%' }}>
                      <h4 style={{ color: '#181c32', fontSize: '14px', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Payment Info</h4>
                      <p style={{ margin: 0, color: '#7e8299', fontSize: '14px', lineHeight: '1.6' }}>
                        Please remit payment by <b>{formatDate(invoice.due_date)}</b>. Payments are securely accepted via E-Transfer or cash.
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontWeight: 'bold', color: '#181c32', fontSize: '16px' }}>Thank you for your business!</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #e4e6ef' }}>
            <FileText size={40} color="#d8d8e5" style={{ margin: '0 auto 15px auto' }} />
            <h3 style={{ color: '#1e1e2d', marginBottom: '5px' }}>No invoices yet</h3>
          </div>
        )}
      </div>

      <NewInvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onInvoiceAdded={fetchInvoices} />

      {/* MODAL DE EDICIÓN */}
      {invoiceToEdit && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Edit Invoice #{invoiceToEdit.invoice_number}</h2>
              <button onClick={() => setInvoiceToEdit(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#a1a5b7" /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}><AlignLeft size={12}/> Invoice Description</label>
                <textarea style={{...inputStyle, minHeight: '60px', resize: 'vertical'}} value={editFormData.notes} onChange={e => setEditFormData({...editFormData, notes: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <label style={labelStyle}>Due Date</label>
                  <input type="date" style={inputStyle} value={editFormData.due_date} onChange={e => setEditFormData({...editFormData, due_date: e.target.value})} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <label style={labelStyle}>Total Amount</label>
                  <input type="number" step="0.01" style={inputStyle} value={editFormData.total_amount} onChange={e => setEditFormData({...editFormData, total_amount: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>Payment Status</label>
                <select style={inputStyle} value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
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
const labelStyle = { fontSize: '10px', fontWeight: '800', color: '#a1a5b7', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' };
const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' };
const pdfBtn = { backgroundColor: '#181c32', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };

const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(24, 28, 50, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 };
const modalStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e4e6ef', fontSize: '14px', outline: 'none', backgroundColor: '#f9f9fb', boxSizing: 'border-box', fontFamily: 'inherit' };

// Plantilla Premium
const offScreenStyle = {
  position: 'absolute', top: '-10000px', left: '-10000px', width: '850px', padding: '70px', backgroundColor: 'white', color: '#1e1e2d', fontFamily: 'Arial, sans-serif'
};

export default Invoices;