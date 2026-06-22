import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { Loader2, Music, FileText, Wallet, AlertCircle, Calendar, ArrowRight, TrendingUp, CheckCircle, User } from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth(); // 🔥 Obtenemos el usuario real de Firebase
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    upcomingGigs: 0,
    pendingQuotes: 0,
    unpaidAmount: 0,
    totalRevenue: 0
  });
  const [recentGigs, setRecentGigs] = useState([]);

  // Extraemos el primer nombre para un saludo más personal
  const firstName = currentUser?.displayName ? currentUser.displayName.split(' ')[0] : 'Freelancer';

  useEffect(() => {
    // Si no hay usuario logueado, no intentamos pedir datos
    if (!currentUser) return;

    setIsLoading(true);

    // 🔥 Peticiones dinámicas usando el UID del usuario actual
    Promise.all([
      api.get(`/gigs?user_id=${currentUser.uid}`),
      api.get(`/quotes?user_id=${currentUser.uid}`),
      api.get(`/invoices?user_id=${currentUser.uid}`)
    ])
    .then(([gigsRes, quotesRes, invoicesRes]) => {
      const gigs = gigsRes.data;
      const quotes = quotesRes.data;
      const invoices = invoicesRes.data;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Gigs Próximos
      const upcoming = gigs.filter(g => {
        if (!g.event_date) return false;
        const gigDate = new Date(g.event_date);
        return gigDate >= today;
      });

      // 2. Quotes Pendientes
      const pendingQ = quotes.filter(q => q.status === 'Pending').length;

      // 3. Monto por cobrar (Invoices Unpaid/Overdue)
      const unpaid = invoices
        .filter(i => i.status === 'Unpaid' || i.status === 'Overdue')
        .reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0);

      // 4. Ganancias totales (Invoices Paid)
      const revenue = invoices
        .filter(i => i.status === 'Paid')
        .reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0);

      setStats({
        upcomingGigs: upcoming.length,
        pendingQuotes: pendingQ,
        unpaidAmount: unpaid,
        totalRevenue: revenue
      });

      // Ordenar gigs por fecha y tomar los 4 más cercanos
      const sortedGigs = upcoming.sort((a, b) => new Date(a.event_date) - new Date(b.event_date)).slice(0, 4);
      setRecentGigs(sortedGigs);

      setIsLoading(false);
    })
    .catch(err => {
      console.error("Error loading dashboard data:", err);
      setIsLoading(false);
    });
  }, [currentUser]); 

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return new Date(date.getTime() + Math.abs(date.getTimezoneOffset() * 60000)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <Loader2 className="animate-spin" color="#009ef7" size={40} />
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#f5f5f9', minHeight: '100vh' }}>
      
      {/* HEADER DINÁMICO */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 5px 0', color: '#181c32', letterSpacing: '-0.5px' }}>
          Welcome back, {firstName}! 👋
        </h1>
        <p style={{ color: '#7e8299', margin: 0, fontSize: '15px' }}>Here is what's happening with your music business today.</p>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{...statCard, borderBottom: '4px solid #50cd89'}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={statLabel}>Total Earnings</p>
              <h2 style={statValue}>{formatCurrency(stats.totalRevenue)}</h2>
            </div>
            <div style={{...iconWrapper, backgroundColor: '#e8fff3', color: '#50cd89'}}>
              <TrendingUp size={22} />
            </div>
          </div>
        </div>

        <div style={{...statCard, borderBottom: '4px solid #f1416c'}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={statLabel}>Esperando Pago</p>
              <h2 style={statValue}>{formatCurrency(stats.unpaidAmount)}</h2>
            </div>
            <div style={{...iconWrapper, backgroundColor: '#fff5f8', color: '#f1416c'}}>
              <AlertCircle size={22} />
            </div>
          </div>
        </div>

        <div style={{...statCard, borderBottom: '4px solid #009ef7'}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={statLabel}>Upcoming Events</p>
              <h2 style={statValue}>{stats.upcomingGigs}</h2>
            </div>
            <div style={{...iconWrapper, backgroundColor: '#e1f0ff', color: '#009ef7'}}>
              <Music size={22} />
            </div>
          </div>
        </div>

        <div style={{...statCard, borderBottom: '4px solid #f6c000'}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={statLabel}>Pending Quotes</p>
              <h2 style={statValue}>{stats.pendingQuotes}</h2>
            </div>
            <div style={{...iconWrapper, backgroundColor: '#fff8dd', color: '#f6c000'}}>
              <FileText size={22} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#181c32', fontSize: '18px', fontWeight: '800' }}>Your Next Performances</h3>
          {recentGigs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {recentGigs.map(gig => (
                <div key={gig.id} style={{ display: 'flex', alignItems: 'center', padding: '15px', backgroundColor: '#f9f9fb', borderRadius: '12px', border: '1px solid #eff2f5' }}>
                  <div style={{ backgroundColor: '#181c32', color: 'white', padding: '12px', borderRadius: '10px', marginRight: '15px', textAlign: 'center', minWidth: '45px' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.8 }}>
                      {new Date(gig.event_date).toLocaleString('en-US', { month: 'short' })}
                    </span>
                    <span style={{ display: 'block', fontSize: '18px', fontWeight: '900' }}>
                      {new Date(gig.event_date).getDate()}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', color: '#181c32', fontSize: '15px', fontWeight: '700' }}>{gig.title}</h4>
                    <p style={{ margin: 0, color: '#7e8299', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={12} /> {gig.client_first_name} {gig.client_last_name}
                    </p>
                  </div>
                  <div style={{ fontWeight: '800', color: '#50cd89', fontSize: '15px' }}>
                    {formatCurrency(gig.fee)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#f9f9fb', borderRadius: '12px', border: '1px dashed #e4e6ef' }}>
              <Calendar size={40} color="#d8d8e5" style={{ margin: '0 auto 15px auto' }} />
              <h4 style={{ color: '#1e1e2d', margin: '0 0 5px 0' }}>No upcoming events</h4>
              <p style={{ color: '#a1a5b7', margin: 0, fontSize: '13px' }}>Time to book some new gigs!</p>
            </div>
          )}
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 5px 15px rgba(0,0,0,0.02)', alignSelf: 'start' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#181c32', fontSize: '18px', fontWeight: '800' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={() => navigate('/gigs')} style={quickActionBtn}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{...actionIcon, backgroundColor: '#e1f0ff', color: '#009ef7'}}><Music size={18} /></div>
                <span style={{ fontWeight: '700', color: '#3f4254' }}>Schedule Event</span>
              </div>
              <ArrowRight size={16} color="#a1a5b7" />
            </button>

            <button onClick={() => navigate('/quotes')} style={quickActionBtn}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{...actionIcon, backgroundColor: '#fff8dd', color: '#f6c000'}}><FileText size={18} /></div>
                <span style={{ fontWeight: '700', color: '#3f4254' }}>Draft Quote</span>
              </div>
              <ArrowRight size={16} color="#a1a5b7" />
            </button>

            <button onClick={() => navigate('/invoices')} style={quickActionBtn}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{...actionIcon, backgroundColor: '#e8fff3', color: '#50cd89'}}><Wallet size={18} /></div>
                <span style={{ fontWeight: '700', color: '#3f4254' }}>Send Invoice</span>
              </div>
              <ArrowRight size={16} color="#a1a5b7" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ESTILOS ---
const statCard = { backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' };
const statLabel = { margin: '0 0 5px 0', fontSize: '13px', color: '#a1a5b7', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' };
const statValue = { margin: 0, fontSize: '28px', fontWeight: '900', color: '#181c32', letterSpacing: '-1px' };
const iconWrapper = { padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const quickActionBtn = { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9fb', border: '1px solid #eff2f5', padding: '12px 15px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' };
const actionIcon = { width: '35px', height: '35px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default Dashboard;