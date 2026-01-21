import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jvamcwzicwhfdjmgatsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YW1jd3ppY3doZmRqbWdhdHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTYzMTEsImV4cCI6MjA3ODczMjMxMX0.9tYXsv5scrsIY_b4OhjwSnM2Pwdlticq5-riEc9pkV4';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function IVDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('all');
  const [dates, setDates] = useState([]);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: ivData, error: ivError } = await supabase
        .from('historical_iv')
        .select('*')
        .order('date', { ascending: false })
        .order('ticker', { ascending: true });
      if (ivError) throw ivError;
      setData(ivData || []);
      const uniqueDates = [...new Set((ivData || []).map(row => row.date))].sort().reverse();
      setDates(uniqueDates);
      if (uniqueDates.length > 0) setSelectedDate(uniqueDates[0]);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const filteredData = selectedDate === 'all' ? data : data.filter(row => row.date === selectedDate);
  const formatPercent = (val) => (val === null || val === undefined) ? '-' : (val * 100).toFixed(1) + '%';
  const getIVRankBg = (rank) => {
    if (rank === null || rank === undefined || rank === 0) return '#f3f4f6';
    if (rank >= 60) return '#bbf7d0';
    if (rank >= 40) return '#fef08a';
    return '#fecaca';
  };
  const getIVRankLabel = (rank) => {
    if (rank === null || rank === undefined || rank === 0) return 'N/A';
    if (rank >= 60) return 'SELL';
    if (rank >= 40) return 'WAIT';
    return 'AVOID';
  };

  if (loading) return <div style={{padding: 40, textAlign: 'center'}}>Loading IV data...</div>;
  if (error) return <div style={{padding: 20, background: '#fee2e2', margin: 20}}><h2 style={{color: '#dc2626'}}>Error</h2><p>{error}</p></div>;

  return (
    <div style={{padding: 16, fontFamily: 'system-ui', background: '#f9fafb', minHeight: '100vh'}}>
      <h1 style={{margin: '0 0 4px 0', fontSize: 24}}>Options IV Dashboard</h1>
<p style={{margin: '0 0 16px 0', color: '#6b7280', fontSize: 14}}>Live data - {data.length} records</p>

<div style={{marginBottom: 16}}>
  <Link href="/options-history">
    <a style={{color: '#3b82f6', textDecoration: 'none', fontSize: 14, fontWeight: 500}}>
      📊 View Options Price History →
    </a>
  </Link>
</div>

<div style={{background: '#d1fae5', border: '1px solid #10b981', padding: 12, borderRadius: 8, marginBottom: 16}}>
        <strong>Connected!</strong> Showing {filteredData.length} rows
      </div>
      <div style={{marginBottom: 16}}>
        <label style={{marginRight: 8, fontWeight: 500}}>Date:</label>
        <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db'}}>
          <option value="all">All Dates</option>
          {dates.map(date => <option key={date} value={date}>{date}</option>)}
        </select>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16}}>
        <div style={{background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center'}}>
          <p style={{margin: 0, fontSize: 12, color: '#6b7280'}}>Stocks</p>
          <p style={{margin: '4px 0 0 0', fontSize: 28, fontWeight: 'bold'}}>{[...new Set(filteredData.map(r => r.ticker))].length}</p>
        </div>
        <div style={{background: '#d1fae5', padding: 16, borderRadius: 8, textAlign: 'center'}}>
          <p style={{margin: 0, fontSize: 12, color: '#166534'}}>High IV</p>
          <p style={{margin: '4px 0 0 0', fontSize: 28, fontWeight: 'bold', color: '#166534'}}>{filteredData.filter(r => r.iv_rank >= 60).length}</p>
        </div>
        <div style={{background: '#fef9c3', padding: 16, borderRadius: 8, textAlign: 'center'}}>
          <p style={{margin: 0, fontSize: 12, color: '#854d0e'}}>Medium</p>
          <p style={{margin: '4px 0 0 0', fontSize: 28, fontWeight: 'bold', color: '#854d0e'}}>{filteredData.filter(r => r.iv_rank >= 40 && r.iv_rank < 60).length}</p>
        </div>
        <div style={{background: '#fee2e2', padding: 16, borderRadius: 8, textAlign: 'center'}}>
          <p style={{margin: 0, fontSize: 12, color: '#dc2626'}}>Low IV</p>
          <p style={{margin: '4px 0 0 0', fontSize: 28, fontWeight: 'bold', color: '#dc2626'}}>{filteredData.filter(r => r.iv_rank < 40 || !r.iv_rank).length}</p>
        </div>
      </div>
      <div style={{background: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 14}}>
          <thead>
            <tr style={{background: '#1f2937', color: 'white'}}>
              <th style={{padding: '12px 8px', textAlign: 'left'}}>Ticker</th>
              <th style={{padding: '12px 8px', textAlign: 'left'}}>Date</th>
              <th style={{padding: '12px 8px', textAlign: 'left'}}>IV</th>
              <th style={{padding: '12px 8px', textAlign: 'left'}}>IV Rank</th>
              <th style={{padding: '12px 8px', textAlign: 'left'}}>Signal</th>
              <th style={{padding: '12px 8px', textAlign: 'left'}}>HV 30d</th>
              <th style={{padding: '12px 8px', textAlign: 'left'}}>IV-HV</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr key={row.id || idx} style={{borderBottom: '1px solid #e5e7eb'}}>
                <td style={{padding: '10px 8px', fontWeight: 'bold'}}>{row.ticker}</td>
                <td style={{padding: '10px 8px', color: '#6b7280'}}>{row.date}</td>
                <td style={{padding: '10px 8px'}}>{formatPercent(row.current_iv)}</td>
                <td style={{padding: '10px 8px', fontWeight: 'bold', background: getIVRankBg(row.iv_rank)}}>{row.iv_rank ? row.iv_rank.toFixed(1) + '%' : '-'}</td>
                <td style={{padding: '10px 8px'}}>{getIVRankLabel(row.iv_rank)}</td>
                <td style={{padding: '10px 8px', color: '#6b7280'}}>{formatPercent(row.hv_30d)}</td>
                <td style={{padding: '10px 8px', color: row.iv_hv_diff > 0 ? '#16a34a' : '#dc2626'}}>{row.iv_hv_diff ? (row.iv_hv_diff * 100).toFixed(1) + '%' : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
