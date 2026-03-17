// TransactionDetail.jsx
// GramSync Merchant App — Transaction Detail & Receipt Screen
// WIRED TO BACKEND API

import { useState, useEffect, useCallback } from "react";
import transactionService from "../api/transactionService";

// ─── Design tokens ────────────────────────────────────────────────
const t = {
  blue:"#2347F5", blueMid:"#3A5BFF", bluePale:"#EEF1FF",
  green:"#0BAF60", greenPale:"#E6F9F0", greenDark:"#098F4E",
  orange:"#F56A00", orangePale:"#FFF0E5", orangeDark:"#C45500",
  red:"#E8304A", redPale:"#FFEBEE", yellow:"#F5A623", yellowPale:"#FFF8E5",
  purple:"#7C3AED", purplePale:"#F3EEFF",
  bg:"#F0F2F8", card:"#FFFFFF", text:"#0D1226", muted:"#7A85A3", border:"#E2E6F3",
};

const CATEGORIES = [
  { id:"groceries",   label:"Groceries",   color:t.green  },
  { id:"dairy",       label:"Dairy",       color:"#0284C7"},
  { id:"grains",      label:"Grains",      color:t.orange },
  { id:"vegetables",  label:"Vegetables",  color:"#16A34A"},
  { id:"household",   label:"Household",   color:t.purple },
  { id:"electronics", label:"Electronics", color:t.blue   },
  { id:"other",       label:"Other",       color:t.muted  },
];

// ─── Global CSS (unchanged from original) ────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  body{background:#F0F2F8;font-family:'Sora',sans-serif}::-webkit-scrollbar{display:none}
  @keyframes heroReveal{0%{opacity:0;transform:translateY(20px) scale(0.96)}70%{transform:translateY(-3px) scale(1.01)}100%{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes paidPop{0%{transform:scale(0.5) rotate(-8deg);opacity:0}65%{transform:scale(1.12) rotate(2deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}
  @keyframes receiptTear{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}
  .edit-input{background:#FAFBFF;border:2px solid #E2E6F3;border-radius:12px;padding:11px 14px;font-family:'Sora',sans-serif;font-size:14px;color:#0D1226;outline:none;width:100%;transition:border-color 0.15s,box-shadow 0.15s}
  .edit-input:focus{border-color:#2347F5;box-shadow:0 0 0 3px rgba(35,71,245,0.10);background:#fff}
  .action-row-btn{flex:1;padding:13px 8px;border-radius:14px;border:1.5px solid;background:none;font-family:'Sora',sans-serif;font-size:12px;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all 0.15s}
  .action-row-btn:hover{opacity:0.82}.action-row-btn:active{transform:scale(0.94)}
  .detail-row{display:flex;align-items:flex-start;justify-content:space-between;padding:11px 0;border-bottom:1px solid #E2E6F3}
  .detail-row:last-child{border-bottom:none}
  .sheet-overlay{position:fixed;inset:0;z-index:200;background:rgba(13,18,38,0.58);display:flex;align-items:flex-end;animation:fadeIn 0.18s ease}
  .sheet-body{background:#fff;border-radius:22px 22px 0 0;width:100%;padding:24px 20px 36px;animation:fadeSlideUp 0.26s cubic-bezier(.22,1,.36,1);box-shadow:0 -8px 40px rgba(0,0,0,0.16)}
  .sheet-handle{width:38px;height:4px;border-radius:99px;background:#E2E6F3;margin:0 auto 20px}
  .category-chip{border-radius:99px;padding:6px 13px;font-family:'Sora',sans-serif;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid;transition:all 0.12s;background:none;white-space:nowrap}
  .category-chip:active{transform:scale(0.94)}
  .receipt-dashes{height:1px;background:repeating-linear-gradient(to right,#E2E6F3 0px,#E2E6F3 6px,transparent 6px,transparent 12px)}
`;

// ─── Loading / Error states ───────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:t.bg }}>
      <div style={{ textAlign:"center", color:t.muted }}>
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" style={{ animation:"spin 1s linear infinite", marginBottom:12 }}>
          <path d="M4 12a8 8 0 018-8v2m8 6a8 8 0 01-8 8v-2" stroke={t.blue} strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div style={{ fontSize:14, fontWeight:600 }}>Loading transaction...</div>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onBack }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:t.bg, flexDirection:"column", gap:16, padding:24 }}>
      <div style={{ fontSize:14, color:t.red, fontWeight:600, textAlign:"center" }}>{message}</div>
      <button onClick={onBack} style={{ background:t.blue, color:"#fff", border:"none", borderRadius:12, padding:"12px 24px", fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>Go Back</button>
    </div>
  );
}

// ─── Sync Badge ───────────────────────────────────────────────────
function SyncBadge({ isPaid }) {
  if (isPaid) return <span style={{ background:t.greenPale, color:t.green, borderRadius:6, fontSize:10, fontWeight:700, padding:"3px 8px", letterSpacing:"0.04em" }}>✓ PAID</span>;
  return <span style={{ background:t.yellowPale, color:t.yellow, borderRadius:6, fontSize:10, fontWeight:700, padding:"3px 8px", letterSpacing:"0.04em", animation:"pulse 1.6s ease-in-out infinite" }}>⏳ PENDING</span>;
}

// ─── Hero Card ────────────────────────────────────────────────────
function HeroCard({ txn, editMode, onAmountChange, onDescChange }) {
  const isUdhar  = txn.type === "UDHAR";
  const gradStart = isUdhar ? "#1a38e8" : "#098F4E";
  const gradEnd   = isUdhar ? "#3a5bff" : "#0BAF60";
  const customerName = txn.customer?.name || "Unknown";
  const initials = customerName.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();

  return (
    <div style={{ margin:"16px", borderRadius:20, background:`linear-gradient(145deg,${gradStart},${gradEnd})`, padding:"22px 22px 20px", position:"relative", overflow:"hidden", animation:"heroReveal 0.45s cubic-bezier(.22,1,.36,1) 0.05s both", boxShadow:`0 12px 36px ${isUdhar?"rgba(35,71,245,0.3)":"rgba(11,175,96,0.3)"}` }}>
      <div style={{ position:"absolute", right:-30, top:-35, width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,0.07)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", left:-20, bottom:-40, width:110, height:110, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }}/>
      <div style={{ fontSize:11, fontWeight:600, opacity:0.7, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:8 }}>
        {isUdhar ? "Udhar — Credit Given" : "Jama — Payment Received"}
      </div>
      {editMode ? (
        <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:10 }}>
          <span style={{ fontSize:28, color:"rgba(255,255,255,0.7)", fontFamily:"'JetBrains Mono',monospace" }}>₹</span>
          <input className="amount-edit-input" type="number" value={txn.amount} onChange={e => onAmountChange(Number(e.target.value)||0)} placeholder="0"
            style={{ background:"none", border:"none", outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:42, fontWeight:800, color:"#fff", flex:1, borderBottom:"2px solid rgba(255,255,255,0.4)", paddingBottom:4 }}/>
        </div>
      ) : (
        <div style={{ fontSize:44, fontWeight:800, color:"#fff", fontFamily:"'JetBrains Mono',monospace", lineHeight:1, marginBottom:10 }}>
          ₹{Number(txn.amount).toLocaleString("en-IN")}.00
        </div>
      )}
      {editMode
        ? <input className="edit-input" value={txn.note||""} onChange={e => onDescChange(e.target.value)} placeholder="Description" style={{ background:"rgba(255,255,255,0.18)", borderColor:"rgba(255,255,255,0.25)", color:"#fff", marginBottom:12 }}/>
        : <div style={{ fontSize:15, fontWeight:600, color:"rgba(255,255,255,0.9)", marginBottom:12 }}>{txn.note||"No description"}</div>
      }
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.15)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff" }}>{initials}</div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{customerName}</div>
            <div style={{ fontSize:10, opacity:0.65 }}>{txn.customer?.phone||""}</div>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:11, opacity:0.65, marginBottom:2 }}>{new Date(txn.createdAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</div>
          <div style={{ fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", opacity:0.8 }}>#{txn.id?.slice(0,8).toUpperCase()}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Action Row ───────────────────────────────────────────────────
function ActionRow({ txn, onEdit, onShare, onReminder, onMarkPaid }) {
  const actions = [
    { label:"Edit",    color:t.blue,  bg:t.bluePale,  icon:<svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={t.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={t.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, onClick:onEdit },
    { label:"Share",   color:"#25D366", bg:"#F0FDF4",  icon:<svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="#25D366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, onClick:onShare },
    { label:"Remind",  color:t.orange, bg:t.orangePale, icon:<svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke={t.orange} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, onClick:onReminder },
    { label:txn.isPaid?"Unpay":"Mark Paid", color:t.green, bg:t.greenPale, icon:<svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke={t.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, onClick:onMarkPaid },
  ];
  return (
    <div style={{ display:"flex", gap:8, padding:"0 16px 16px" }}>
      {actions.map((a,i) => (
        <button key={i} className="action-row-btn" style={{ borderColor:a.bg, color:a.color }} onClick={a.onClick}>
          <div style={{ width:36, height:36, borderRadius:10, background:a.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>{a.icon}</div>
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Detail Card ──────────────────────────────────────────────────
function DetailCard({ txn, editMode, onNoteChange, onCategoryChange }) {
  const catObj = CATEGORIES.find(c => c.id === (txn.category||"other")) || CATEGORIES[CATEGORIES.length-1];
  const rows = [
    { label:"Transaction ID", value:`#${txn.id?.slice(0,8).toUpperCase()||"—"}`, mono:true },
    { label:"Customer",       value:txn.customer?.name||"—",                     mono:false },
    { label:"Phone",          value:txn.customer?.phone||"—",                    mono:true  },
    { label:"Type",           value:txn.type==="UDHAR"?"Udhar (Credit Given)":"Jama (Payment Received)", mono:false },
    { label:"Status",         value:null, component:<SyncBadge isPaid={txn.isPaid}/> },
    { label:"Created",        value:new Date(txn.createdAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}), mono:false },
  ];
  return (
    <div style={{ margin:"0 16px 14px", background:"#fff", borderRadius:16, padding:"0 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      {rows.map((row,i) => (
        <div key={i} className="detail-row">
          <span style={{ fontSize:12, color:t.muted, fontWeight:500, flexShrink:0, paddingTop:2 }}>{row.label}</span>
          <div style={{ textAlign:"right", maxWidth:"60%" }}>
            {row.component || <span style={{ fontSize:12, fontWeight:600, color:t.text, fontFamily:row.mono?"'JetBrains Mono',monospace":"'Sora',sans-serif", wordBreak:"break-all" }}>{row.value}</span>}
          </div>
        </div>
      ))}
      <div className="detail-row" style={{ flexDirection:"column", gap:8, paddingBottom:14 }}>
        <span style={{ fontSize:12, color:t.muted, fontWeight:500 }}>Note</span>
        {editMode
          ? <input className="edit-input" value={txn.note||""} onChange={e => onNoteChange(e.target.value)} placeholder="Add a note…"/>
          : <span style={{ fontSize:13, color:txn.note?t.text:t.muted, fontStyle:txn.note?"normal":"italic" }}>{txn.note||"No note added"}</span>
        }
      </div>
      <div className="detail-row" style={{ flexDirection:"column", gap:8, paddingBottom:14, borderBottom:"none" }}>
        <span style={{ fontSize:12, color:t.muted, fontWeight:500 }}>Category</span>
        {editMode ? (
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} className="category-chip" onClick={() => onCategoryChange(cat.id)} style={{ borderColor:txn.category===cat.id?cat.color:t.border, background:txn.category===cat.id?cat.color+"18":"#fff", color:txn.category===cat.id?cat.color:t.muted }}>{cat.label}</button>
            ))}
          </div>
        ) : (
          <span style={{ display:"inline-flex", alignItems:"center", background:catObj.color+"18", color:catObj.color, borderRadius:99, padding:"4px 12px", fontSize:12, fontWeight:700 }}>{catObj.label}</span>
        )}
      </div>
    </div>
  );
}

// ─── Share Sheet ──────────────────────────────────────────────────
function ShareSheet({ txn, onClose }) {
  const isUdhar = txn.type === "UDHAR";
  const waText = `*GramSync Receipt*\n\n*${isUdhar?"Credit (Udhar)":"Payment (Jama)"}*\nAmount: ₹${Number(txn.amount).toLocaleString("en-IN")}\nCustomer: ${txn.customer?.name||"—"}\nDate: ${new Date(txn.createdAt).toLocaleString("en-IN")}\nRef: #${txn.id?.slice(0,8).toUpperCase()}\n\n_Powered by GramSync_`;
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-body" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{ fontSize:16, fontWeight:700, color:t.text, marginBottom:16 }}>Share Receipt</div>
        <div style={{ background:"#F0FDF4", borderRadius:14, padding:"14px 16px", marginBottom:20, fontFamily:"monospace", fontSize:12, color:"#111", lineHeight:1.8, whiteSpace:"pre-line" }}>{waText}</div>
        <button onClick={() => { navigator.clipboard?.writeText(waText).catch(()=>{}); onClose(); }} style={{ width:"100%", padding:"14px 16px", borderRadius:14, border:"none", background:"#25D366", color:"#fff", fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 14px rgba(37,211,102,0.35)" }}>
          💬 Share via WhatsApp
        </button>
      </div>
    </div>
  );
}

// ─── Mark Paid Sheet ──────────────────────────────────────────────
function MarkPaidSheet({ txn, onConfirm, onClose }) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-body" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ width:60, height:60, borderRadius:"50%", background:t.greenPale, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke={t.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ fontSize:17, fontWeight:800, color:t.text, marginBottom:4 }}>Mark as Paid?</div>
          <div style={{ fontSize:13, color:t.muted, lineHeight:1.6 }}>Amount: <strong style={{ color:t.text }}>₹{Number(txn.amount).toLocaleString("en-IN")}</strong></div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:14, borderRadius:12, background:t.bg, color:t.muted, border:`1.5px solid ${t.border}`, fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:14, borderRadius:12, background:t.green, color:"#fff", border:"none", fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer", boxShadow:"0 4px 14px rgba(11,175,96,0.3)" }}>Confirm Paid</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Sheet ─────────────────────────────────────────────────
function DeleteSheet({ txn, onConfirm, onClose }) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-body" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ width:60, height:60, borderRadius:"50%", background:t.redPale, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke={t.red} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ fontSize:17, fontWeight:800, color:t.text, marginBottom:6 }}>Delete Transaction?</div>
          <div style={{ fontSize:13, color:t.muted, lineHeight:1.6 }}>
            <strong style={{ color:t.red }}>This cannot be undone.</strong><br/>
            ₹{Number(txn.amount).toLocaleString("en-IN")} will be removed and balance recalculated.
          </div>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, color:t.muted, marginBottom:8 }}>Type <strong style={{ fontFamily:"'JetBrains Mono',monospace", color:t.text }}>DELETE</strong> to confirm</div>
          <input className="edit-input" placeholder="DELETE" onChange={e => setConfirmed(e.target.value==="DELETE")} style={{ borderColor:confirmed?t.red:t.border }}/>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:14, borderRadius:12, background:t.bg, color:t.muted, border:`1.5px solid ${t.border}`, fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>Cancel</button>
          <button onClick={() => confirmed && onConfirm()} disabled={!confirmed} style={{ flex:1, padding:14, borderRadius:12, background:confirmed?t.red:t.border, color:confirmed?"#fff":t.muted, border:"none", fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:14, cursor:confirmed?"pointer":"default", boxShadow:confirmed?"0 4px 14px rgba(232,48,74,0.3)":"none", transition:"all 0.2s" }}>Delete Forever</button>
        </div>
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────
function Topbar({ editMode, saving, onBack, onToggleEdit, onDelete }) {
  return (
    <div style={{ background:"#fff", padding:"14px 16px", display:"flex", alignItems:"center", gap:10, borderBottom:`1px solid ${t.border}`, position:"sticky", top:0, zIndex:50 }}>
      <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", flexShrink:0 }}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" stroke={t.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:17, fontWeight:700, color:t.text }}>Transaction Detail</div>
        <div style={{ fontSize:11, color:t.muted, marginTop:1 }}>{editMode?"Editing — tap fields to change":"View & manage this entry"}</div>
      </div>
      <div style={{ display:"flex", gap:6 }}>
        <button onClick={onToggleEdit} style={{ background:editMode?t.green:t.bluePale, border:"none", borderRadius:10, padding:"7px 14px", cursor:"pointer", fontFamily:"'Sora',sans-serif", fontSize:12, fontWeight:700, color:editMode?"#fff":t.blue, transition:"all 0.15s" }}>
          {saving ? "Saving..." : editMode ? "Save" : "Edit"}
        </button>
        <button onClick={onDelete} style={{ background:t.redPale, border:"none", borderRadius:10, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke={t.red} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
/**
 * TransactionDetail
 *
 * Props:
 *  - transactionId   {string}   ID of the transaction to load from API
 *  - transaction     {object}   OR pass the full transaction object directly (skips fetch)
 *  - onBack          {fn}
 *  - onDelete        {fn}
 *  - onReminder      {fn}
 */
export default function TransactionDetail({
  transactionId,
  transaction: transactionProp = null,
  onBack      = () => {},
  onDelete    = () => {},
  onReminder  = () => {},
}) {
  const [txn,      setTxn]      = useState(transactionProp);
  const [loading,  setLoading]  = useState(!transactionProp);
  const [error,    setError]    = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [sheet,    setSheet]    = useState(null);
  const [shown,    setShown]    = useState(false);

  useEffect(() => { const id = setTimeout(() => setShown(true), 60); return () => clearTimeout(id); }, []);

  // ── Fetch transaction if only ID was passed ────────────────────
  useEffect(() => {
    if (transactionProp) { setTxn(transactionProp); return; }
    if (!transactionId) { setError("No transaction ID provided"); setLoading(false); return; }
    setLoading(true);
    transactionService.get(transactionId)
      .then(res => { setTxn(res.data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [transactionId, transactionProp]);

  // ── Save edits ─────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    // Note: edit saves note/category locally for now
    // Full edit endpoint can be wired here when backend supports it
    setSaving(true);
    await new Promise(r => setTimeout(r, 400)); // simulate save
    setSaving(false);
    setEditMode(false);
  }, []);

  const handleToggleEdit = useCallback(() => {
    if (editMode) handleSave();
    else setEditMode(true);
  }, [editMode, handleSave]);

  // ── Mark Paid — real API call ──────────────────────────────────
  const handleMarkPaid = useCallback(async () => {
    try {
      await transactionService.markPaid(txn.id);
      setTxn(prev => ({ ...prev, isPaid:true }));
      setSheet(null);
    } catch (err) {
      setError(err.message);
    }
  }, [txn?.id]);

  // ── Delete — real API call ─────────────────────────────────────
  const handleDelete = useCallback(async () => {
    try {
      await transactionService.remove(txn.id);
      setSheet(null);
      onDelete(txn.id);
      onBack();
    } catch (err) {
      setError(err.message);
    }
  }, [txn?.id, onDelete, onBack]);

  const updateField = useCallback((field, value) => {
    setTxn(prev => ({ ...prev, [field]:value }));
  }, []);

  if (loading) return <LoadingScreen/>;
  if (error && !txn) return <ErrorScreen message={error} onBack={onBack}/>;
  if (!txn) return null;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ width:"100%", maxWidth:420, minHeight:"100vh", background:t.bg, display:"flex", flexDirection:"column", margin:"0 auto", fontFamily:"'Sora',sans-serif", opacity:shown?1:0, transition:"opacity 0.25s ease", position:"relative" }}>
        <Topbar editMode={editMode} saving={saving} onBack={onBack} onToggleEdit={handleToggleEdit} onDelete={() => setSheet("delete")}/>
        <div style={{ flex:1, overflowY:"auto", paddingBottom:24 }}>
          <HeroCard txn={txn} editMode={editMode} onAmountChange={v => updateField("amount",v)} onDescChange={v => updateField("note",v)}/>
          <div style={{ margin:"0 16px 14px", display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:14, height:14, borderRadius:"50%", background:t.bg, flexShrink:0, marginLeft:-22 }}/>
            <div className="receipt-dashes" style={{ flex:1, animation:"receiptTear 0.4s ease 0.3s both" }}/>
            <div style={{ width:14, height:14, borderRadius:"50%", background:t.bg, flexShrink:0, marginRight:-22 }}/>
          </div>
          <ActionRow txn={txn} onEdit={() => setEditMode(true)} onShare={() => setSheet("share")} onReminder={() => onReminder(txn.customer)} onMarkPaid={() => txn.isPaid ? setTxn(p=>({...p,isPaid:false})) : setSheet("paid")}/>
          <DetailCard txn={txn} editMode={editMode} onNoteChange={v => updateField("note",v)} onCategoryChange={v => updateField("category",v)}/>

          {error && (
            <div style={{ margin:"0 16px 14px", background:t.redPale, borderRadius:12, padding:"10px 14px", fontSize:12, color:t.red, fontWeight:600 }}>{error}</div>
          )}
        </div>

        {sheet==="share"  && <ShareSheet   txn={txn} onClose={() => setSheet(null)}/>}
        {sheet==="paid"   && <MarkPaidSheet txn={txn} onConfirm={handleMarkPaid}  onClose={() => setSheet(null)}/>}
        {sheet==="delete" && <DeleteSheet   txn={txn} onConfirm={handleDelete}    onClose={() => setSheet(null)}/>}
      </div>
    </>
  );
}