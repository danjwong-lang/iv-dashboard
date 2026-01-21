import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = 'https://jvamcwzicwhfdjmgatsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YW1jd3ppY3doZmRqbWdhdHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTYzMTEsImV4cCI6MjA3ODczMjMxMX0.9tYXsv5scrsIY_b4OhjwSnM2Pwdlticq5-riEc9pkV4';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function OptionsHistory() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [optionType, setOptionType] = useState('call');
  const [expirations, setExpirations] = useState([]);
  const [selectedExpiration, setSelectedExpiration] = useState('');
  const [strikes, setStrikes] = useState([]);
  const [selectedStrike, setSelectedStrike] = useState('');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Load available stocks on mount
  useEffect(() => {
    loadStocks();
  }, []);

  // Load expirations when stock or type changes
  useEffect(() => {
    if (selectedStock) {
      loadExpirations();
    }
  }, [selectedStock, optionType]);

  // Load strikes when expiration changes
  useEffect(() => {
    if (selectedExpiration) {
      loadStrikes();
    }
  }, [selectedExpiration]);

  // Load chart data when strike changes
  useEffect(() => {
    if (selectedStrike) {
      loadChartData();
    }
  }, [selectedStrike]);

  async function loadStocks() {
    const { data } = await supabase
      .from('historical_iv')
      .select('ticker')
      .order('ticker');
    const uniqueStocks = [...new Set(data?.map(d => d.ticker) || [])];
    setStocks(uniqueStocks);
    if (uniqueStocks.length > 0) setSelectedStock(uniqueStocks[0]);
  }

  async function loadExpirations() {
    const { data } = await supabase
      .from('options_data')
      .select('expiration')
      .eq('ticker', selectedStock)
      .eq('option_type', optionType)
      .order('expiration');
    const uniqueExp = [...new Set(data?.map(d => d.expiration) || [])];
    setExpirations(uniqueExp);
    setSelectedExpiration(uniqueExp[0] || '');
    setStrikes([]);
    setSelectedStrike('');
  }

  async function loadStrikes() {
    const { data } = await supabase
      .from('options_data')
      .select('strike')
      .eq('ticker', selectedStock)
      .eq('option_type', optionType)
      .eq('expiration', selectedExpiration)
      .order('strike');
    const uniqueStrikes = [...new Set(data?.map(d => d.strike) || [])];
    setStrikes(uniqueStrikes);
    setSelectedStrike(uniqueStrikes[0] || '');
  }

  async function loadChartData() {
    setLoading(true);
    
    // Get option prices
    const { data: optionsData } = await supabase
      .from('options_data')
      .select('date, last, bid, ask, volume, open_interest, implied_volatility')
      .eq('ticker', selectedStock)
      .eq('option_type', optionType)
      .eq('expiration', selectedExpiration)
      .eq('strike', selectedStrike)
      .order('date');

    // Get IV Rank data
    const { data: ivData } = await supabase
      .from('historical_iv')
      .select('date, iv_rank, current_iv')
      .eq('ticker', selectedStock)
      .order('date');

    // Merge data by date
    const merged = (optionsData || []).map(opt => {
      const iv = ivData?.find(i => i.date === opt.date);
      return {
        date: opt.date,
        price: opt.last || ((opt.bid + opt.ask) / 2),
        ivRank: iv?.iv_rank || null,
        currentIV: iv?.current_iv || null,
        volume: opt.volume,
        openInterest: opt.open_interest
      };
    }).filter(d => d.price > 0);

    setChartData(merged);

    // Calculate stats
    if (merged.length > 0) {
      const prices = merged.map(d => d.price);
      const current = merged[merged.length - 1];
      const highPoint = merged.reduce((max, d) => d.price > max.price ? d : max);
      const lowPoint = merged.reduce((min, d) => d.price < min.price ? d : min);
      
      setStats({
        current: current.price,
        currentIVRank: current.ivRank,
        high: highPoint.price,
        highDate: highPoint.date,
        highIVRank: highPoint.ivRank,
        low: lowPoint.price,
        lowDate: lowPoint.date,
        lowIVRank: lowPoint.ivRank,
        average: prices.reduce((a, b) => a + b, 0) / prices.length,
        change: current.price - merged[0].price,
        changePercent: ((current.price - merged[0].price) / merged[0].price) * 100
      });
    }

    setLoading(false);
  }

  const formatPrice = (val) => val ? `$${val.toFixed(2)}` : '-';
  const formatPercent = (val) => val ? `${val.toFixed(1)}%` : '-';

  return (
    <div style={{padding: 16, fontFamily: 'system-ui', background: '#f9fafb', minHeight: '100vh'}}>
      {/* Header */}
      <div style={{marginBottom: 24}}>
        <Link href="/" style={{color: '#3b82f6', textDecoration: 'none', fontSize: 14}}>
          ← Back to Dashboard
        </Link>
        <h1 style={{margin: '8px 0 4px 0', fontSize: 28, fontWeight: 'bold'}}>Options Price History</h1>
        <p style={{margin: 0, color: '#6b7280', fontSize: 14}}>
          See how option prices correlate with IV over time
        </p>
      </div>

      {/* Selectors */}
      <div style={{background: 'white', padding: 20, borderRadius: 8, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16}}>
          
          {/* Stock */}
          <div>
            <label style={{display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500}}>Stock</label>
            <select value={selectedStock} onChange={(e) => setSelectedStock(e.target.value)}
              style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db'}}>
              {stocks.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Type */}
          <div>
            <label style={{display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500}}>Type</label>
            <select value={optionType} onChange={(e) => setOptionType(e.target.value)}
              style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db'}}>
              <option value="call">Call</option>
              <option value="put">Put</option>
            </select>
          </div>

          {/* Expiration */}
          <div>
            <label style={{display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500}}>Expiration</label>
            <select value={selectedExpiration} onChange={(e) => setSelectedExpiration(e.target.value)}
              disabled={!expirations.length}
              style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db'}}>
              {expirations.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* Strike */}
          <div>
            <label style={{display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500}}>Strike</label>
            <select value={selectedStrike} onChange={(e) => setSelectedStrike(e.target.value)}
              disabled={!strikes.length}
              style={{width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db'}}>
              {strikes.map(s => <option key={s} value={s}>${s}</option>)}
            </select>
          </div>

        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{textAlign: 'center', padding: 40}}>
          <p>Loading data...</p>
        </div>
      )}

      {/* Stats */}
      {stats && !loading && (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20}}>
          <div style={{background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <p style={{margin: 0, fontSize: 12, color: '#6b7280'}}>Current Price</p>
            <p style={{margin: '4px 0 0 0', fontSize: 24, fontWeight: 'bold'}}>{formatPrice(stats.current)}</p>
            <p style={{margin: 0, fontSize: 12, color: '#6b7280'}}>IV Rank: {formatPercent(stats.currentIVRank)}</p>
          </div>

          <div style={{background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <p style={{margin: 0, fontSize: 12, color: '#6b7280'}}>Highest</p>
            <p style={{margin: '4px 0 0 0', fontSize: 24, fontWeight: 'bold', color: '#16a34a'}}>{formatPrice(stats.high)}</p>
            <p style={{margin: 0, fontSize: 12, color: '#6b7280'}}>{stats.highDate} (IV {formatPercent(stats.highIVRank)})</p>
          </div>

          <div style={{background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <p style={{margin: 0, fontSize: 12, color: '#6b7280'}}>Lowest</p>
            <p style={{margin: '4px 0 0 0', fontSize: 24, fontWeight: 'bold', color: '#dc2626'}}>{formatPrice(stats.low)}</p>
            <p style={{margin: 0, fontSize: 12, color: '#6b7280'}}>{stats.lowDate} (IV {formatPercent(stats.lowIVRank)})</p>
          </div>

          <div style={{background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <p style={{margin: 0, fontSize: 12, color: '#6b7280'}}>Average</p>
            <p style={{margin: '4px 0 0 0', fontSize: 24, fontWeight: 'bold'}}>{formatPrice(stats.average)}</p>
            <p style={{margin: 0, fontSize: 12, color: stats.change >= 0 ? '#16a34a' : '#dc2626'}}>
              {stats.change >= 0 ? '+' : ''}{formatPrice(Math.abs(stats.change))} ({stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(1)}%)
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && !loading && (
        <div style={{background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
          <h3 style={{margin: '0 0 16px 0', fontSize: 18}}>
            {selectedStock} ${selectedStrike} {optionType === 'call' ? 'Call' : 'Put'} - Price vs IV Rank
          </h3>
          
          {/* Simple text-based chart for now */}
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', fontSize: 13, borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: '#f3f4f6'}}>
                  <th style={{padding: 8, textAlign: 'left'}}>Date</th>
                  <th style={{padding: 8, textAlign: 'right'}}>Price</th>
                  <th style={{padding: 8, textAlign: 'right'}}>IV Rank</th>
                  <th style={{padding: 8, textAlign: 'right'}}>Volume</th>
                  <th style={{padding: 8, textAlign: 'right'}}>OI</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((d, i) => (
                  <tr key={i} style={{borderBottom: '1px solid #e5e7eb'}}>
                    <td style={{padding: 8}}>{d.date}</td>
                    <td style={{padding: 8, textAlign: 'right', fontWeight: 'bold'}}>{formatPrice(d.price)}</td>
                    <td style={{padding: 8, textAlign: 'right'}}>{formatPercent(d.ivRank)}</td>
                    <td style={{padding: 8, textAlign: 'right'}}>{d.volume || '-'}</td>
                    <td style={{padding: 8, textAlign: 'right'}}>{d.openInterest || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{marginTop: 16, fontSize: 12, color: '#6b7280', textAlign: 'center'}}>
            📊 Visual chart coming next - this shows the raw data correlation
          </p>
        </div>
      )}

      {/* No data */}
      {chartData.length === 0 && !loading && selectedStrike && (
        <div style={{background: '#fef3c7', padding: 20, borderRadius: 8, textAlign: 'center'}}>
          <p style={{margin: 0}}>No data found for this option contract</p>
        </div>
      )}
    </div>
  );
}
