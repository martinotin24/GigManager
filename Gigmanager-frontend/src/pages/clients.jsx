import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext'; // 🔥 1. IMPORTAMOS EL CONTEXTO
import { Plus, Loader2, MapPin, Mail, Phone, ChevronDown, ChevronUp, Trash2, Edit } from 'lucide-react';
import NewClientModal from '../components/NewClientModal';

const Clients = () => {
  const { currentUser } = useAuth(); // 🔥 2. EXTRAEMOS AL USUARIO ACTUAL
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  
  const [clientToEdit, setClientToEdit] = useState(null);

  const fetchClients = () => {
    // 🔥 Si no hay usuario logueado, detenemos la función
    if (!currentUser) return;

    setIsLoading(true);
    // 🔥 3. USAMOS EL UID DINÁMICO
    api.get(`/clients?user_id=${currentUser.uid}`)
      .then(res => {
        setClients(res.data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchClients();
  }, [currentUser]); // 🔥 RECARGA CUANDO EL USUARIO CAMBIA

  const handleDelete = async (e, client) => {
    e.stopPropagation();
    
    const confirmDelete = window.confirm(
      `⚠️ DANGER ZONE: Are you sure you want to delete ${client.first_name} ${client.last_name}?\n\n` +
      `This action is PERMANENT and will delete all their associated Gigs, Quotes, and Invoices.`
    );

    if (confirmDelete) {
      try {
        // 🔥 4. ENVIAMOS EL UID REAL PARA AUTORIZAR EL BORRADO
        await api.delete(`/clients/${client.id}`, { data: { user_id: currentUser.uid } });
        setClients(clients.filter(c => c.id !== client.id));
      } catch (err) {
        alert("Error deleting client. Please check your MySQL ON DELETE CASCADE settings.");
      }
    }
  };

  const handleEdit = (e, client) => {
    e.stopPropagation(); 
    setClientToEdit(client);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setClientToEdit(null);
    setIsModalOpen(true);
  };

  const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase();

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
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>Client Directory</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>Manage your professional network.</p>
        </div>
        <button 
          onClick={handleAddNew}
          style={{ backgroundColor: '#7239ea', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Plus size={18} style={{ marginRight: '8px' }} /> New Client
        </button>
      </div>

      {/* LISTA DE CLIENTES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {clients.length > 0 ? clients.map((client) => (
          <div key={client.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden' }}>
            
            {/* Fila Principal */}
            <div 
              onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}
              style={{ padding: '15px 25px', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={avatarStyle}>{getInitials(client.first_name, client.last_name)}</div>
                <span style={{ fontWeight: '700' }}>{client.first_name} {client.last_name}</span>
              </div>
              
              <div style={{ flex: 1, color: '#666', fontSize: '14px' }}>{client.email}</div>
              
              {/* BOTONES DE ACCIÓN */}
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button 
                  onClick={(e) => handleEdit(e, client)}
                  style={iconBtnStyle} 
                  title="Edit Client"
                >
                  <Edit size={16} color="#666" />
                </button>
                <button 
                  onClick={(e) => handleDelete(e, client)} 
                  style={iconBtnStyle} 
                  title="Delete Client"
                >
                  <Trash2 size={16} color="#ef4444" />
                </button>
                <div style={{ borderLeft: '1px solid #eee', height: '20px', margin: '0 5px' }}></div>
                {expandedId === client.id ? <ChevronUp size={20} color="#7239ea"/> : <ChevronDown size={20} color="#999" />}
              </div>
            </div>

            {/* Detalles Expandidos */}
            {expandedId === client.id && (
              <div style={{ padding: '20px 25px 20px 80px', backgroundColor: '#fcfcfd', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <p style={labelStyle}><Mail size={12} /> Contact</p>
                    <p style={textStyle}>{client.email}</p>
                    <p style={textStyle}>{client.phone}</p>
                  </div>
                  <div>
                    <p style={labelStyle}><MapPin size={12} /> Address</p>
                    <p style={textStyle}>{client.street}</p>
                    <p style={textStyle}>{client.city}, {client.province}</p>
                    <p style={{ ...textStyle, color: '#7239ea', fontWeight: 'bold' }}>{client.country}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )) : (
          <p style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>No clients found.</p>
        )}
      </div>

      {/* MODAL INTEGRADO */}
      <NewClientModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setClientToEdit(null);
        }} 
        onClientAdded={fetchClients} 
        clientToEdit={clientToEdit}
      />
    </div>
  );
};

// --- ESTILOS ---
const avatarStyle = { width: '35px', height: '35px', borderRadius: '8px', backgroundColor: '#f1f1f4', color: '#7239ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' };
const labelStyle = { fontSize: '10px', fontWeight: '800', color: '#7239ea', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' };
const textStyle = { fontSize: '14px', margin: '2px 0', color: '#444' };
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', transition: 'background 0.2s' };

export default Clients;