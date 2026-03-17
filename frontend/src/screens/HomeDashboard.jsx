// HomeDashboard.jsx
// GramSync Merchant App - Home Screen
// WIRED TO BACKEND API

import { useState, useEffect } from "react";
import { useDashboard } from "../hooks/useDashboard";
import { useI18n } from "../i18n/i18n.jsx";

// ─── Design tokens ────────────────────────────────────────────────
const t = {
  blue:"#2347F5", blueMid:"#3A5BFF", bluePale:"#EEF1FF",
  green:"#0BAF60", greenPale:"#E6F9F0",
  orange:"#F56A00", red:"#E8304A", yellow:"#F5A623",
  bg:"#F0F2F8", card:"#FFFFFF", text:"#0D1226", muted:"#7A85A3", border:"#E2E6F3",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  body{background:#F0F2F8;font-family:'Sora',sans-serif}::-webkit-scrollbar{display:none}

  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .skeleton{background:linear-gradient(90deg,#E2E6F3 25%,#F0F2F8 50%,#E2E6F3 75%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite;border-radius:8px}
`;

// ─── Sub-components (unchanged) ──────────────────────────────────
function Avatar({ initials, bg = t.bluePale, color = t.blue, size = 40 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, color, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:size*0.33, fontFamily:"'Sora',sans-serif" }}>
      {initials}
    </div>
  );
}

function Card({ children, style = {}, ...props }) {
  return <div {...props} style={{ background:t.card, borderRadius:14, padding:14, boxShadow:"0 1px 4px rgba(0,0,0,0.05)", ...style }}>{children}</div>;
}

// ─── Hero Card ────────────────────────────────────────────────────
function HeroCard({ amount, loading }) {
  const [shown, setShown] = useState(false);
  const { tr } = useI18n();
  useEffect(() => { const id = setTimeout(() => setShown(true), 80); return () => clearTimeout(id); }, []);

  return (
    <div style={{ margin:"16px 16px 12px", borderRadius:20, background:"linear-gradient(135deg,#1a38e8 0%,#3a5bff 100%)", color:"#fff", padding:"22px 22px 20px", position:"relative", overflow:"hidden", opacity:shown?1:0, transform:shown?"translateY(0)":"translateY(12px)", transition:"opacity .35s ease,transform .35s ease" }}>
      <div style={{ position:"absolute", right:-30, top:-40, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.07)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", right:30, bottom:-50, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }}/>
      <div style={{ fontSize:11, fontWeight:600, letterSpacing:"0.08em", opacity:0.75, textTransform:"uppercase", marginBottom:6 }}>{tr("home.total_outstanding_credit")}</div>
      {loading ? (
        <div className="skeleton" style={{ height:40, width:"60%", marginBottom:8, background:"rgba(255,255,255,0.2)" }}/>
      ) : (
        <div style={{ fontSize:34, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}>₹{amount}</div>
      )}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(255,255,255,0.18)", borderRadius:8, padding:"3px 10px", fontSize:12, fontWeight:700 }}>
          ↑ {tr("home.live")}
        </span>
        <span style={{ fontSize:11, opacity:0.65 }}>{tr("common.updated_just_now")}</span>
      </div>
    </div>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────
function StatsRow({ udharCount, jamaCount, loading }) {
  const { tr } = useI18n();
  return (
    <div style={{ display:"flex", gap:12, margin:"0 16px 12px" }}>
      {[
        { label:tr("home.udhar").toUpperCase(), labelColor:t.orange, icon:"▲", count:udharCount, sub:tr("home.credits_today"), delay:120 },
        { label:tr("home.jama").toUpperCase(),  labelColor:t.green,  icon:"▼", count:jamaCount,  sub:tr("home.payments_today"), delay:200 },
      ].map((item, i) => (
        <StatCard key={i} {...item} loading={loading}/>
      ))}
    </div>
  );
}

function StatCard({ label, labelColor, icon, count, sub, delay, loading }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const id = setTimeout(() => setShown(true), delay); return () => clearTimeout(id); }, [delay]);
  return (
    <Card style={{ flex:1, opacity:shown?1:0, transform:shown?"translateY(0)":"translateY(10px)", transition:"opacity .3s ease,transform .3s ease" }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:labelColor, marginBottom:4 }}>{icon} {label}</div>
      {loading
        ? <div className="skeleton" style={{ height:28, width:40, marginBottom:4 }}/>
        : <div style={{ fontSize:28, fontWeight:800, color:t.text, marginBottom:2 }}>{count}</div>
      }
      <div style={{ fontSize:11, color:t.muted }}>{sub}</div>
    </Card>
  );
}

// ─── Quick Actions (unchanged) ────────────────────────────────────
function QuickActions({ onReminders, onCustomers }) {
  const { tr } = useI18n();
  const actions = [
    { label: tr("home.send_reminders"), icon:<svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="#F56A00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, iconBg:"#FFF0E5", onClick:onReminders },
    { label: tr("nav.customers"),      icon:<svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" stroke="#0BAF60" strokeWidth="1.8"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="#0BAF60" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" stroke="#0BAF60" strokeWidth="1.8" strokeLinecap="round"/></svg>, iconBg:"#E6F9F0", onClick:onCustomers },
  ];
  return (
    <div style={{ margin:"0 16px 16px" }}>
      <div style={{ fontSize:13, fontWeight:700, color:t.text, marginBottom:10 }}>{tr("home.quick_actions")}</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:10 }}>
        {actions.map((a,i) => (
          <button key={i} onClick={a.onClick} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:7, padding:"13px 8px", background:"#fff", border:`1.5px solid ${t.border}`, borderRadius:14, cursor:"pointer", fontFamily:"'Sora',sans-serif", transition:"box-shadow 0.15s,transform 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow="0 3px 12px rgba(0,0,0,0.08)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow="none"}
            onMouseDown={e => e.currentTarget.style.transform="scale(0.96)"}
            onMouseUp={e => e.currentTarget.style.transform="scale(1)"}
          >
            <div style={{ width:38, height:38, borderRadius:10, background:a.iconBg, display:"flex", alignItems:"center", justifyContent:"center" }}>{a.icon}</div>
            <span style={{ fontSize:10, fontWeight:700, color:t.text, textAlign:"center", lineHeight:1.3 }}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Sync Health (unchanged) ──────────────────────────────────────
function SyncHealth({ status = "EXCELLENT", message }) {
  const isGood = status === "EXCELLENT";
  return (
    <div style={{ margin:"0 16px 16px" }}>
      <Card>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:"50%", background:isGood?t.greenPale:"#FFF8E5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {isGood
              ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke={t.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={t.yellow} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:t.text, display:"flex", alignItems:"center", gap:8 }}>
              Sync Health
              <span style={{ fontSize:11, fontWeight:700, color:isGood?t.green:t.yellow }}>{status}</span>
            </div>
            <div style={{ fontSize:12, color:t.muted, marginTop:2, lineHeight:1.5 }}>{message}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Recent Transactions — maps real API data ─────────────────────
function mapTransaction(tx) {
  const isUdhar = tx.type === "UDHAR";
  const name    = tx.customer?.name || "Walk-in Customer";
  const initials = name.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
  const amount  = Number(tx.amount || 0);
  const time    = tx.createdAt
    ? new Date(tx.createdAt).toLocaleTimeString("en-IN", { hour:"numeric", minute:"2-digit" })
    : "Just now";

  return {
    id:          tx.id,
    name,
    initials,
    type:        isUdhar ? "Udhar" : "Jama",
    time,
    amount:      `${isUdhar ? "−" : "+"}₹${amount.toLocaleString("en-IN")}`,
    amountColor: isUdhar ? t.orange : t.green,
    status:      "SYNCED",
    statusColor: t.green,
    avatarBg:    isUdhar ? t.bluePale  : t.greenPale,
    avatarColor: isUdhar ? t.blue      : t.green,
  };
}

function RecentTransactions({ transactions, loading, onViewAll, onTxnPress }) {
  const { tr } = useI18n();
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"0 16px 10px" }}>
        <div style={{ fontSize:15, fontWeight:700, color:t.text }}>Recent Transactions</div>
        <button onClick={onViewAll} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, color:t.blue, fontFamily:"'Sora',sans-serif", padding:0 }}>View All</button>
      </div>
      <div style={{ margin:"0 16px", display:"flex", flexDirection:"column", gap:10 }}>
        {loading ? (
          [1,2,3].map(i => (
            <Card key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div className="skeleton" style={{ width:42, height:42, borderRadius:"50%", flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div className="skeleton" style={{ height:14, width:"50%", marginBottom:6 }}/>
                <div className="skeleton" style={{ height:11, width:"35%" }}/>
              </div>
              <div className="skeleton" style={{ height:14, width:60 }}/>
            </Card>
          ))
        ) : transactions.length === 0 ? (
          <div style={{ textAlign:"center", padding:"24px 0", color:t.muted, fontSize:13 }}>{tr("home.no_transactions_yet")}</div>
        ) : (
          transactions.map((tx, i) => {
            const mapped = mapTransaction(tx);
            return <TxnRow key={mapped.id} tx={mapped} delay={280 + i * 80} onPress={onTxnPress}/>;
          })
        )}
      </div>
    </div>
  );
}

function TxnRow({ tx, delay, onPress }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const id = setTimeout(() => setShown(true), delay); return () => clearTimeout(id); }, [delay]);
  return (
    <Card style={{ display:"flex", alignItems:"center", gap:12, opacity:shown?1:0, transform:shown?"translateX(0)":"translateX(-10px)", transition:"opacity .3s ease,transform .3s ease", cursor:"pointer" }} onClick={() => onPress?.(tx)}>
      <Avatar initials={tx.initials} bg={tx.avatarBg} color={tx.avatarColor} size={42}/>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:600, color:t.text }}>{tx.name}</div>
        <div style={{ fontSize:11, color:t.muted, marginTop:1 }}>{tx.type} · {tx.time}</div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontSize:14, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:tx.amountColor }}>{tx.amount}</div>
        <div style={{ fontSize:10, fontWeight:600, marginTop:2, color:tx.statusColor }}>✓ {tx.status}</div>
      </div>
    </Card>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────
function Topbar({ onNotification, onProfile }) {
  const { tr } = useI18n();
  return (
    <div style={{ background:"#fff", padding:"16px 20px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${t.border}`, position:"sticky", top:0, zIndex:50 }}>
      <div>
        <div style={{ fontSize:17, fontWeight:700, color:t.text }}>GramSync Merchant</div>
        <div style={{ fontSize:10, color:t.muted, fontWeight:500, letterSpacing:"0.06em", textTransform:"uppercase", marginTop:1 }}>{tr("home.store_dashboard")}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onNotification} style={{ background:"none", border:"none", cursor:"pointer", position:"relative", padding:2 }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke={t.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ position:"absolute", top:0, right:0, width:8, height:8, background:t.red, borderRadius:"50%", border:"2px solid #fff" }}/>
        </button>
        <button onClick={onProfile} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
          <Avatar initials="GS" bg={t.bluePale} color={t.blue} size={36}/>
        </button>
      </div>
    </div>
  );
}

// ─── FAB (unchanged) ──────────────────────────────────────────────
function FAB({ onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)} onClick={onClick}
      style={{ position:"absolute", bottom:"calc(84px + env(safe-area-inset-bottom))", right:16, width:52, height:52, borderRadius:"50%", background:t.blue, color:"#fff", border:"none", fontSize:26, cursor:"pointer", boxShadow:"0 4px 16px rgba(35,71,245,0.42)", display:"flex", alignItems:"center", justifyContent:"center", transform:pressed?"scale(0.92)":"scale(1)", transition:"transform 0.12s ease", zIndex:60 }}>
      +
    </button>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────

function NavIcon({ name, size=22 }) {
  const s = { stroke:"currentColor", strokeWidth:"1.8", strokeLinecap:"round", strokeLinejoin:"round" };
  switch(name) {
    case "home":      return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9" {...s}/><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" {...s}/></svg>;
    case "customers": return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" {...s}/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" {...s}/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" {...s}/></svg>;
    case "reports":   return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" {...s}/><path d="M8 17v-5M12 17V7M16 17v-3" {...s}/></svg>;
    case "settings":  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" {...s}/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...s}/></svg>;
    default: return null;
  }
}

function BottomNav({ active="home", onNavigate }) {
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
        <button key={item.id} onClick={() => onNavigate?.(item.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 0 12px", gap:4, cursor:"pointer", border:"none", background:"none", color:active===item.id?t.blue:t.muted, fontFamily:"'Sora',sans-serif", fontSize:10, fontWeight:500, transition:"color 0.15s" }}>
          <NavIcon name={item.id} size={22}/>{item.label}
        </button>
      ))}
    </nav>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }) {
  const { tr } = useI18n();
  return (
    <div style={{ margin:"16px", background:"#FFEBEE", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <span style={{ fontSize:13, color:t.red, fontWeight:600 }}>{message}</span>
      <button onClick={onRetry} style={{ background:t.red, color:"#fff", border:"none", borderRadius:8, padding:"6px 12px", fontFamily:"'Sora',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer" }}>{tr("common.retry")}</button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function HomeDashboard({
  onNavigate       = () => {},
  onAddTransaction = () => {},
  onViewAll        = () => {},
  onNotification   = () => {},
  onProfile        = () => {},
  onTxnPress       = () => {},
  onReminders      = () => {},
}) {
  const {
    totalCredit,
    udharCount,
    jamaCount,
    transactions,
    loading,
    error,
    refresh,
  } = useDashboard();

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ width:"100%", maxWidth:420, minHeight:"100dvh", background:t.bg, display:"flex", flexDirection:"column", margin:"0 auto", position:"relative", fontFamily:"'Sora',sans-serif" }}>
        <Topbar onNotification={onNotification} onProfile={onProfile}/>

        <div style={{ flex:1, overflowY:"auto", paddingBottom:"calc(20px + env(safe-area-inset-bottom))" }}>
          <HeroCard amount={totalCredit} loading={loading}/>

          {error && <ErrorBanner message={error} onRetry={refresh}/>}

          <StatsRow udharCount={udharCount} jamaCount={jamaCount} loading={loading}/>
          <QuickActions onReminders={onReminders} onCustomers={onViewAll}/>
          <SyncHealth
            status="EXCELLENT"
            message="All transactions are synced to cloud."
          />
          <RecentTransactions
            transactions={transactions}
            loading={loading}
            onViewAll={onViewAll}
            onTxnPress={onTxnPress}
          />
          <div style={{ height:"calc(72px + env(safe-area-inset-bottom))" }}/>
        </div>

        <FAB onClick={onAddTransaction}/>
        <BottomNav active="home" onNavigate={onNavigate}/>
      </div>
    </>
  );
}
