// ReportsDashboard.jsx
// GramSync Merchant App — Reports & Analytics Screen
// WIRED TO BACKEND API

import { useState, useEffect, useRef, useCallback } from "react";
import { useReports } from "../hooks/useReports";
import { useI18n } from "../i18n/i18n.jsx";

// ─── Design tokens ────────────────────────────────────────────────
const t = {
  blue:"#2347F5", blueMid:"#3A5BFF", bluePale:"#EEF1FF",
  green:"#0BAF60", greenPale:"#E6F9F0",
  orange:"#F56A00", orangePale:"#FFF0E5",
  red:"#E8304A", redPale:"#FFEBEE",
  yellow:"#F5A623", yellowPale:"#FFF8E5",
  bg:"#F0F2F8", card:"#FFFFFF", text:"#0D1226", muted:"#7A85A3", border:"#E2E6F3",
};

// ─── Fallback empty data shape ────────────────────────────────────
const EMPTY_DATA = {
  kpis: { totalCredit:0, collected:0, pending:0, customers:0, transactions:0, recoveryRate:0 },
  barLabels:[], udharData:[], jamaData:[], trendLabels:[], trendData:[], topCustomers:[],
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  body{background:#F0F2F8;font-family:'Sora',sans-serif}::-webkit-scrollbar{display:none}
  @keyframes fadeSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes countUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .skeleton{background:linear-gradient(90deg,#E2E6F3 25%,#F0F2F8 50%,#E2E6F3 75%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite;border-radius:8px}
  .period-tab{flex:1;padding:9px 0;border:none;border-radius:10px;font-family:'Sora',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:background 0.15s,color 0.15s,box-shadow 0.15s}
  .kpi-card{flex:1;background:#fff;border-radius:14px;padding:13px 14px;box-shadow:0 1px 4px rgba(0,0,0,0.05);animation:countUp 0.3s ease}
  .section-card{background:#fff;border-radius:16px;margin:0 16px 14px;box-shadow:0 1px 4px rgba(0,0,0,0.05);overflow:hidden}
  .customer-row{display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer;transition:background 0.12s}
  .customer-row:hover{background:#FAFBFF}
  .sheet-overlay{position:fixed;inset:0;z-index:200;background:rgba(13,18,38,0.55);display:flex;align-items:flex-end;animation:fadeIn 0.18s ease}
  .sheet-body{background:#fff;border-radius:22px 22px 0 0;width:100%;padding:24px 20px 36px;animation:fadeSlideUp 0.26s cubic-bezier(.22,1,.36,1);box-shadow:0 -8px 40px rgba(0,0,0,0.15)}
  .export-btn{width:100%;padding:15px;border-radius:14px;border:none;font-family:'Sora',sans-serif;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:transform 0.1s,filter 0.1s;margin-bottom:10px}
  .export-btn:active{transform:scale(0.97)}
  .nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;padding:10px 0 12px;gap:4px;cursor:pointer;border:none;background:none;font-family:'Sora',sans-serif;font-size:10px;font-weight:500;transition:color 0.15s}
`;

// ─── Chart.js loader ──────────────────────────────────────────────
function useChartJs(onLoad) {
  useEffect(() => {
    if (window.Chart) { onLoad(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = onLoad;
    document.head.appendChild(s);
  }, []);
}

// ─── Bar Chart ────────────────────────────────────────────────────
function UdharJamaChart({ labels, udharData, jamaData }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const draw = useCallback(() => {
    if (!canvasRef.current || !window.Chart || !labels.length) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(canvasRef.current, {
      type:"bar",
      data:{
        labels,
        datasets:[
          { label:"Udhar", data:udharData, backgroundColor:"#F56A00CC", borderRadius:6, borderSkipped:false },
          { label:"Jama",  data:jamaData,  backgroundColor:"#0BAF60CC", borderRadius:6, borderSkipped:false },
        ],
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:ctx => ` ₹${ctx.raw.toLocaleString("en-IN")}` } } },
        scales:{
          x:{ grid:{display:false}, ticks:{font:{family:"'Sora',sans-serif",size:11},color:"#7A85A3"}, border:{display:false} },
          y:{ grid:{color:"#E2E6F3"}, ticks:{font:{family:"'JetBrains Mono',monospace",size:10},color:"#7A85A3",callback:v=>"₹"+(v>=1000?(v/1000).toFixed(0)+"K":v)}, border:{display:false} },
        },
      },
    });
  }, [labels, udharData, jamaData]);

  useChartJs(draw);
  useEffect(() => { draw(); }, [draw]);
  useEffect(() => () => { chartRef.current?.destroy(); }, []);

  if (!labels.length) return <div style={{ height:180, display:"flex", alignItems:"center", justifyContent:"center", color:t.muted, fontSize:13 }}>No data for this period</div>;

  return <div style={{ position:"relative", height:180 }}><canvas ref={canvasRef}/></div>;
}

// ─── Donut ────────────────────────────────────────────────────────
function RecoveryDonut({ rate, collected, pending }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const draw = useCallback(() => {
    if (!canvasRef.current || !window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(canvasRef.current, {
      type:"doughnut",
      data:{ datasets:[{ data:[rate, 100-rate], backgroundColor:["#0BAF60","#E2E6F3"], borderWidth:0, borderRadius:4 }] },
      options:{ responsive:true, maintainAspectRatio:false, cutout:"76%", plugins:{legend:{display:false},tooltip:{enabled:false}} },
    });
  }, [rate]);

  useChartJs(draw);
  useEffect(() => { draw(); }, [draw]);
  useEffect(() => () => { chartRef.current?.destroy(); }, []);

  return (
    <div style={{ display:"flex", alignItems:"center", gap:20, padding:16 }}>
      <div style={{ position:"relative", width:90, height:90, flexShrink:0 }}>
        <canvas ref={canvasRef}/>
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div style={{ fontSize:18, fontWeight:800, color:t.green, fontFamily:"'JetBrains Mono',monospace" }}>{rate}%</div>
          <div style={{ fontSize:9, color:t.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Recovered</div>
        </div>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
        <div>
          <div style={{ fontSize:11, color:t.muted, marginBottom:3 }}>Collected</div>
          <div style={{ fontSize:16, fontWeight:800, color:t.green, fontFamily:"'JetBrains Mono',monospace" }}>₹{collected.toLocaleString("en-IN")}</div>
        </div>
        <div style={{ height:1, background:t.border }}/>
        <div>
          <div style={{ fontSize:11, color:t.muted, marginBottom:3 }}>Still Pending</div>
          <div style={{ fontSize:16, fontWeight:800, color:t.orange, fontFamily:"'JetBrains Mono',monospace" }}>₹{pending.toLocaleString("en-IN")}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Trend Line ───────────────────────────────────────────────────
function TrendLine({ labels, data }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const draw = useCallback(() => {
    if (!canvasRef.current || !window.Chart || !labels.length) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(canvasRef.current, {
      type:"line",
      data:{
        labels,
        datasets:[{
          label:"Net Position", data,
          borderColor:"#2347F5", backgroundColor:"rgba(35,71,245,0.08)",
          borderWidth:2, pointBackgroundColor:data.map(v => v>=0?"#2347F5":"#E8304A"),
          pointRadius:4, pointHoverRadius:6, fill:true, tension:0.4,
        }],
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:ctx => ` ${ctx.raw>=0?"+":""}₹${ctx.raw.toLocaleString("en-IN")}` } } },
        scales:{
          x:{ grid:{display:false}, ticks:{font:{family:"'Sora',sans-serif",size:11},color:"#7A85A3"}, border:{display:false} },
          y:{ grid:{color:"#E2E6F3"}, ticks:{font:{family:"'JetBrains Mono',monospace",size:10},color:"#7A85A3",callback:v=>(v>=0?"+":"")+(Math.abs(v)>=1000?(v/1000).toFixed(1)+"K":v)}, border:{display:false} },
        },
      },
    });
  }, [labels, data]);

  useChartJs(draw);
  useEffect(() => { draw(); }, [draw]);
  useEffect(() => () => { chartRef.current?.destroy(); }, []);

  if (!labels.length) return <div style={{ height:140, display:"flex", alignItems:"center", justifyContent:"center", color:t.muted, fontSize:13 }}>No data</div>;

  return <div style={{ position:"relative", height:140, padding:"0 16px 16px" }}><canvas ref={canvasRef}/></div>;
}

// ─── KPI Card ─────────────────────────────────────────────────────
function KpiCard({ label, value, sub, subColor, icon, iconBg, loading }) {
  return (
    <div className="kpi-card">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <div style={{ fontSize:10, fontWeight:700, color:t.muted, letterSpacing:"0.06em", textTransform:"uppercase" }}>{label}</div>
        <div style={{ width:28, height:28, borderRadius:8, background:iconBg, display:"flex", alignItems:"center", justifyContent:"center" }}>{icon}</div>
      </div>
      {loading
        ? <div className="skeleton" style={{ height:24, width:"60%", marginBottom:4 }}/>
        : <div style={{ fontSize:20, fontWeight:800, color:t.text, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{value}</div>
      }
      {sub && <div style={{ fontSize:11, color:subColor||t.muted, marginTop:4, fontWeight:600 }}>{sub}</div>}
    </div>
  );
}

// ─── Top Customers ────────────────────────────────────────────────
const STATUS_COLOR = { safe:t.green, caution:t.yellow, "high-risk":t.red };
const STATUS_BG    = { safe:t.greenPale, caution:t.yellowPale, "high-risk":t.redPale };

function TopCustomers({ customers, onPress, loading }) {
  if (loading) {
    return (
      <div>
        {[1,2,3].map(i => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px" }}>
            <div className="skeleton" style={{ width:40, height:40, borderRadius:"50%", flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <div className="skeleton" style={{ height:14, width:"50%", marginBottom:6 }}/>
              <div className="skeleton" style={{ height:11, width:"30%" }}/>
            </div>
            <div className="skeleton" style={{ height:14, width:60 }}/>
          </div>
        ))}
      </div>
    );
  }
  if (!customers.length) return <div style={{ padding:"20px 16px", textAlign:"center", color:t.muted, fontSize:13 }}>No customers yet</div>;

  return (
    <div>
      {customers.map((c, i) => (
        <div key={c.id||i}>
          {i > 0 && <div style={{ height:1, background:t.border, margin:"0 16px" }}/>}
          <div className="customer-row" onClick={() => onPress(c)}>
            <div style={{ width:40, height:40, borderRadius:"50%", flexShrink:0, background:STATUS_BG[c.status]||t.bluePale, color:STATUS_COLOR[c.status]||t.blue, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13 }}>{c.initials}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:t.text }}>{c.name}</div>
              <div style={{ fontSize:11, color:t.muted, marginTop:1, display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:STATUS_COLOR[c.status]||t.muted, display:"inline-block" }}/>
                {(c.status||"new").replace("-"," ")}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:14, fontWeight:700, color:c.overdue?t.red:t.text, fontFamily:"'JetBrains Mono',monospace" }}>₹{c.balance.toLocaleString("en-IN")}</div>
              {c.overdue && <span style={{ fontSize:10, fontWeight:700, color:t.red, background:t.redPale, borderRadius:4, padding:"1px 6px" }}>OVERDUE</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Export Sheet ─────────────────────────────────────────────────
function ExportSheet({ period, onClose }) {
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  const handleCsvExport = async () => {
    try {
      const token = localStorage.getItem('gramsync_token');
      const res = await fetch(`${BASE_URL}/reports/export-csv?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `gramsync-report-${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
    onClose();
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-body" onClick={e => e.stopPropagation()}>
        <div style={{ width:38, height:4, borderRadius:99, background:t.border, margin:"0 auto 20px" }}/>
        <div style={{ fontSize:16, fontWeight:700, color:t.text, marginBottom:4 }}>Export Report</div>
        <div style={{ fontSize:12, color:t.muted, marginBottom:20 }}>
          Last {period==="7D"?"7 days":period==="1M"?"30 days":"3 months"} of transactions
        </div>
        <button className="export-btn" onClick={handleCsvExport} style={{ background:t.green, color:"#fff" }}>
          <span style={{ fontSize:16 }}>📊</span>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontWeight:700 }}>Export CSV</div>
            <div style={{ fontSize:11, opacity:0.8, fontWeight:400 }}>Raw data for spreadsheets</div>
          </div>
        </button>
        <button className="export-btn" onClick={onClose} style={{ background:t.bg, color:t.muted, border:`1px solid ${t.border}` }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Period Tabs ──────────────────────────────────────────────────
function PeriodTabs({ active, onChange }) {
  return (
    <div style={{ display:"flex", gap:4, background:t.bg, padding:4, borderRadius:14, margin:"14px 16px 0" }}>
      {["7D","1M","3M"].map(p => (
        <button key={p} className="period-tab" onClick={() => onChange(p)}
          style={{ background:active===p?"#fff":"transparent", color:active===p?t.blue:t.muted, boxShadow:active===p?"0 1px 6px rgba(0,0,0,0.08)":"none" }}>
          {p}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px 10px" }}>
      <div style={{ fontSize:14, fontWeight:700, color:t.text }}>{title}</div>
      {action && <button onClick={onAction} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, color:t.blue, fontFamily:"'Sora',sans-serif" }}>{action}</button>}
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────

function NavIcon({ id }) {
  const s = { stroke:"currentColor", strokeWidth:"1.8", strokeLinecap:"round", strokeLinejoin:"round" };
  switch(id) {
    case "home":      return <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9" {...s}/><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" {...s}/></svg>;
    case "customers": return <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" {...s}/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" {...s}/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" {...s}/></svg>;
    case "reports":   return <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" {...s}/><path d="M8 17v-5M12 17V7M16 17v-3" {...s}/></svg>;
    case "settings":  return <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" {...s}/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...s}/></svg>;
    default: return null;
  }
}
function BottomNav({ onNavigate }) {
  const { tr } = useI18n();
  const navItems = [
    { id:"home", label: tr("nav.home").toUpperCase() },
    { id:"customers", label: tr("nav.customers").toUpperCase() },
    { id:"reports", label: tr("nav.reports").toUpperCase() },
    { id:"settings", label: tr("nav.settings").toUpperCase() },
  ];
  return (
    <nav style={{ position:"sticky", bottom:0, background:"#fff", borderTop:`1px solid ${t.border}`, display:"flex", zIndex:100, paddingBottom:"env(safe-area-inset-bottom)" }}>
      {navItems.map(item => (
        <button key={item.id} className="nav-btn" onClick={() => onNavigate?.(item.id)} style={{ color:item.id==="reports"?t.blue:t.muted }}>
          <NavIcon id={item.id}/>{item.label}
        </button>
      ))}
    </nav>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function ReportsDashboard({
  onNavigate      = () => {},
  onBack          = () => {},
  onCustomerPress = () => {},
}) {
  const { tr } = useI18n();
  const [period,     setPeriod]     = useState("1M");
  const [showExport, setShowExport] = useState(false);
  const [shown,      setShown]      = useState(false);
  const [chartKey,   setChartKey]   = useState(0);

  const { data, loading, error, refresh } = useReports(period);
  const d    = data || EMPTY_DATA;
  const kpis = d.kpis;

  useEffect(() => { const id = setTimeout(() => setShown(true), 60); return () => clearTimeout(id); }, []);

  const handlePeriod = useCallback((p) => {
    setPeriod(p);
    setChartKey(k => k + 1);
  }, []);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ width:"100%", maxWidth:420, minHeight:"100dvh", background:t.bg, display:"flex", flexDirection:"column", margin:"0 auto", fontFamily:"'Sora',sans-serif" }}>

        {/* Topbar */}
        <div style={{ background:"#fff", padding:"14px 16px", display:"flex", alignItems:"center", gap:12, borderBottom:`1px solid ${t.border}`, position:"sticky", top:0, zIndex:50 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" stroke={t.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ fontSize:18, fontWeight:700, color:t.text, flex:1 }}>{tr("nav.reports")}</div>
          <button onClick={() => setShowExport(true)} style={{ display:"flex", alignItems:"center", gap:6, background:t.bluePale, border:"none", borderRadius:10, padding:"7px 12px", cursor:"pointer", fontFamily:"'Sora',sans-serif", fontSize:12, fontWeight:700, color:t.blue }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={t.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Export
          </button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", paddingBottom:"calc(84px + env(safe-area-inset-bottom))", opacity:shown?1:0, transition:"opacity 0.25s ease" }}>
          <PeriodTabs active={period} onChange={handlePeriod}/>

          <div style={{ padding:"10px 16px 0", fontSize:12, color:t.muted, fontWeight:500 }}>
            {period==="7D"?"Last 7 days":period==="1M"?"Last 30 days":"Last 3 months"} · Updated just now
          </div>

          {error && (
            <div style={{ margin:"12px 16px", background:"#FFEBEE", borderRadius:12, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13, color:t.red, fontWeight:600 }}>{error}</span>
              <button onClick={refresh} style={{ background:t.red, color:"#fff", border:"none", borderRadius:8, padding:"6px 12px", fontFamily:"'Sora',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer" }}>{tr("common.retry")}</button>
            </div>
          )}

          {/* KPI Grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, padding:"10px 16px 0" }} key={`kpi-${period}`}>
            <KpiCard loading={loading} label="Total Credit Given"  value={`₹${(kpis.totalCredit/1000).toFixed(1)}K`}  sub={`${kpis.transactions} transactions`} subColor={t.muted}   icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" stroke={t.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} iconBg={t.orangePale}/>
            <KpiCard loading={loading} label="Amount Collected"    value={`₹${(kpis.collected/1000).toFixed(1)}K`}    sub={`${kpis.recoveryRate}% recovery`}    subColor={t.green}    icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke={t.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} iconBg={t.greenPale}/>
            <KpiCard loading={loading} label="Pending Balance"     value={`₹${(kpis.pending/1000).toFixed(1)}K`}      sub="outstanding"                          subColor={kpis.pending>10000?t.orange:t.muted} icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke={t.yellow} strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke={t.yellow} strokeWidth="1.8" strokeLinecap="round"/></svg>} iconBg={t.yellowPale}/>
            <KpiCard loading={loading} label="Active Customers"    value={kpis.customers}                              sub="with balance"                          subColor={t.muted}    icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" stroke={t.blue} strokeWidth="1.8"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke={t.blue} strokeWidth="1.8" strokeLinecap="round"/></svg>} iconBg={t.bluePale}/>
          </div>

          {/* Bar Chart */}
          <div className="section-card" style={{ marginTop:14 }}>
            <SectionHeader title="Udhar vs Jama"/>
            <div style={{ display:"flex", gap:16, padding:"0 16px 12px", fontSize:12, color:t.muted }}>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:10, height:10, borderRadius:2, background:t.orange, display:"inline-block" }}/>Udhar</span>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:10, height:10, borderRadius:2, background:t.green, display:"inline-block" }}/>Jama</span>
            </div>
            <div style={{ padding:"0 16px 16px" }}>
              <UdharJamaChart key={`bar-${period}-${chartKey}`} labels={d.barLabels} udharData={d.udharData} jamaData={d.jamaData}/>
            </div>
          </div>

          {/* Donut */}
          <div className="section-card">
            <SectionHeader title="Recovery Rate"/>
            <RecoveryDonut key={`donut-${period}-${chartKey}`} rate={kpis.recoveryRate} collected={kpis.collected} pending={kpis.pending}/>
          </div>

          {/* Trend */}
          <div className="section-card">
            <SectionHeader title="Net Position Trend"/>
            <div style={{ padding:"0 16px 8px", fontSize:11, color:t.muted }}>Daily Udhar minus Jama</div>
            <TrendLine key={`trend-${period}-${chartKey}`} labels={d.trendLabels} data={d.trendData}/>
          </div>

          {/* Top Customers */}
          <div className="section-card">
            <SectionHeader title="Top Balances" action="View All" onAction={() => onNavigate("customers")}/>
            <TopCustomers customers={d.topCustomers} onPress={onCustomerPress} loading={loading}/>
            <div style={{ height:12 }}/>
          </div>

          {/* Smart Insight */}
          {!loading && (
            <div style={{ margin:"0 16px 8px", background:t.bluePale, borderRadius:14, padding:"14px 16px", display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ width:32, height:32, borderRadius:8, background:t.blue, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="#fff" strokeWidth="1.8"/><path d="M12 8v4m0 4h.01" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:t.blue, marginBottom:3 }}>Smart Insight</div>
                <div style={{ fontSize:12, color:t.blue, lineHeight:1.6, opacity:0.8 }}>
                  {kpis.recoveryRate < 65
                    ? `Recovery rate is below 65%. Consider sending reminders to overdue customers.`
                    : `Recovery rate is healthy at ${kpis.recoveryRate}%. Keep monitoring high-risk customers.`}
                </div>
              </div>
            </div>
          )}
        </div>

        <BottomNav onNavigate={onNavigate}/>
        {showExport && <ExportSheet period={period} onClose={() => setShowExport(false)}/>}
      </div>
    </>
  );
}
