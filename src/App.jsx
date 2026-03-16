// App.jsx
// GramSync Merchant App — Root Navigator (Updated)
//
// Wiring changes:
//   - Authentication screen: login + signup modes
//   - OnboardingWizard: triggered after signup success
//   - PaymentReminder: dedicated button on HomeDashboard quick-access row
//   - TransactionDetail: tapping any transaction row opens detail
//   - GramScoreDetail: from CustomerProfile score tap
//   - NotificationsCentre: bell icon in topbar
//   - All back navigation and cross-screen params properly threaded

import { useState, useCallback, useRef } from "react";

// ── Screen imports ──────────────────────────────────────────────
import Authentication    from "./screens/Authentication";
import OnboardingWizard  from "./screens/OnboardingWizard";
import HomeDashboard     from "./screens/HomeDashboard";
import CustomersList     from "./screens/CustomersList";
import CustomerProfile   from "./screens/CustomerProfile";
import GramScoreDetail   from "./screens/GramScoreDetail";
import TransactionDetail from "./screens/TransactionDetail";
import PaymentReminder   from "./screens/PaymentReminder";
import ReportsDashboard  from "./screens/ReportsDashboard";
import NotificationsCentre from "./screens/NotificationsCentre";
import ScanQR            from "./screens/ScanQR";
import TransactionKeypad from "./screens/TransactionKeypad";
import Settings          from "./screens/Settings";
import NetworkSync       from "./screens/NetworkSync";

// ── Screen IDs ──────────────────────────────────────────────────
const S = {
  login:             "login",
  signup:            "signup",
  onboarding:        "onboarding",
  home:              "home",
  customers:         "customers",
  customerProfile:   "customerProfile",
  gramScore:         "gramScore",
  transactionDetail: "transactionDetail",
  paymentReminder:   "paymentReminder",
  reports:           "reports",
  notifications:     "notifications",
  scan:              "scan",
  keypad:            "keypad",
  settings:          "settings",
  networkSync:       "networkSync",
};

// ── Screen order for directional transitions ────────────────────
const SCREEN_ORDER = [
  S.login, S.signup, S.onboarding,
  S.home, S.customers, S.customerProfile,
  S.gramScore, S.transactionDetail, S.paymentReminder,
  S.notifications, S.reports, S.scan, S.keypad,
  S.settings, S.networkSync,
];

const TRANSITION_MS = 220;

// ── Global CSS ──────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  html, body, #root { height: 100%; }
  body {
    background: #E8EAF2;
    font-family: 'Sora', sans-serif;
    display: flex;
    justify-content: center;
  }
  ::-webkit-scrollbar { display: none; }

  @keyframes slideInRight {
    from { transform: translateX(32px); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes slideInLeft {
    from { transform: translateX(-32px); opacity: 0; }
    to   { transform: translateX(0);     opacity: 1; }
  }
  @keyframes slideInUp {
    from { transform: translateY(24px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes fadeScreen {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .screen-enter-right { animation: slideInRight ${TRANSITION_MS}ms cubic-bezier(.22,1,.36,1) forwards; }
  .screen-enter-left  { animation: slideInLeft  ${TRANSITION_MS}ms cubic-bezier(.22,1,.36,1) forwards; }
  .screen-enter-up    { animation: slideInUp    ${TRANSITION_MS}ms cubic-bezier(.22,1,.36,1) forwards; }
  .screen-enter-fade  { animation: fadeScreen   ${TRANSITION_MS}ms ease forwards; }
`;

// ── Transition direction heuristic ──────────────────────────────
function getTransitionClass(from, to) {
  if (to === S.scan)   return "screen-enter-up";
  if (to === S.keypad && from === S.scan) return "screen-enter-left";
  if (to === S.login || to === S.signup)  return "screen-enter-fade";
  const fi = SCREEN_ORDER.indexOf(from);
  const ti = SCREEN_ORDER.indexOf(to);
  if (fi === -1 || ti === -1) return "screen-enter-fade";
  return ti > fi ? "screen-enter-right" : "screen-enter-left";
}

// ── Simple router ────────────────────────────────────────────────
function useRouter(initial) {
  const [stack, setStack]   = useState([{ id: initial, params: {} }]);
  const [anim,  setAnim]    = useState("screen-enter-fade");

  const current  = stack[stack.length - 1];
  const previous = stack.length > 1 ? stack[stack.length - 2] : null;

  const navigate = useCallback((screenId, params = {}) => {
    setStack(prev => {
      const from = prev[prev.length - 1].id;
      setAnim(getTransitionClass(from, screenId));
      return [...prev, { id: screenId, params }];
    });
  }, []);

  // Replace current screen (no back)
  const replace = useCallback((screenId, params = {}) => {
    setStack(prev => {
      const from = prev[prev.length - 1].id;
      setAnim(getTransitionClass(from, screenId));
      return [...prev.slice(0, -1), { id: screenId, params }];
    });
  }, []);

  // Pop entire stack to root
  const reset = useCallback((screenId, params = {}) => {
    setAnim("screen-enter-fade");
    setStack([{ id: screenId, params }]);
  }, []);

  const goBack = useCallback(() => {
    setStack(prev => {
      if (prev.length <= 1) return prev;
      const next = prev[prev.length - 2];
      const from = prev[prev.length - 1].id;
      setAnim(getTransitionClass(from, next.id));
      return prev.slice(0, -1);
    });
  }, []);

  return { current, previous, anim, navigate, replace, reset, goBack };
}

// ── Toast ────────────────────────────────────────────────────────
function Toast({ message, visible }) {
  return (
    <div style={{
      position: "fixed",
      bottom: 92,
      left: "50%",
      transform: `translateX(-50%) translateY(${visible ? 0 : 10}px)`,
      background: "#0D1226",
      color: "#fff",
      padding: "10px 20px",
      borderRadius: 99,
      fontSize: 13,
      fontWeight: 600,
      boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      zIndex: 999,
      opacity: visible ? 1 : 0,
      transition: "opacity 0.25s ease, transform 0.25s ease",
      pointerEvents: "none",
      whiteSpace: "nowrap",
      fontFamily: "'Sora', sans-serif",
    }}>
      {message}
    </div>
  );
}

function useToast() {
  const [toast,   setToast]  = useState({ message: "", visible: false });
  const timerRef = useRef(null);
  const show = useCallback((msg) => {
    clearTimeout(timerRef.current);
    setToast({ message: msg, visible: true });
    timerRef.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2600);
  }, []);
  return { toast, show };
}

// ── Overdue Reminder Banner (shown on HomeDashboard) ─────────────
// Injected as a child element — HomeDashboard doesn't have a built-in
// reminder shortcut, so we pass it via a prop that renders inside
// the scrollable content area using the onReminders callback.

// ── Root App ─────────────────────────────────────────────────────
export default function App() {
  const router = useRouter(S.login);
  const { current, anim, navigate, replace, reset, goBack } = router;
  const { toast, show: showToast } = useToast();

  // Shared app state
  const [syncOnline,       setSyncOnline]       = useState(true);
  const [transactions,     setTransactions]     = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [notifCount,       setNotifCount]       = useState(3); // unread badge

  const addTransaction = useCallback((txn) => {
    setTransactions(prev => [{ ...txn, id: Date.now(), time: new Date() }, ...prev]);
  }, []);

  // ── Cross-screen handlers ──────────────────────────────────────

  // Auth → if signup, go to onboarding; if login, go to home
  const handleAuthDone = useCallback((mode) => {
    if (mode === "signup") {
      replace(S.onboarding);
    } else {
      reset(S.home);
    }
  }, [replace, reset]);

  // Onboarding complete → go home
  const handleOnboardingComplete = useCallback((storeData) => {
    showToast(`Welcome, ${storeData.storeName}! 🎉`);
    reset(S.home);
  }, [reset, showToast]);

  // Transaction keypad done
  const handleTransactionDone = useCallback((txn) => {
    addTransaction(txn);
    showToast(`₹${txn.amount} ${txn.type === "udhar" ? "credit" : "payment"} recorded ✓`);
    reset(S.home);
  }, [addTransaction, showToast, reset]);

  // QR scan success → go to keypad with customer
  const handleScanSuccess = useCallback((customer) => {
    setSelectedCustomer(customer);
    navigate(S.keypad, { customer });
    showToast(`${customer.name} verified ✓`);
  }, [navigate, showToast]);

  // Customer tap (from list or dashboard)
  const handleCustomerPress = useCallback((customer) => {
    setSelectedCustomer(customer);
    navigate(S.customerProfile, { customer });
  }, [navigate]);

  // Bell icon
  const handleNotification = useCallback(() => {
    setNotifCount(0);
    navigate(S.notifications);
  }, [navigate]);

  // Bottom nav global handler — used by all screens
  const handleNavigate = useCallback((screenId) => {
    switch (screenId) {
      case "home":      reset(S.home);      break;
      case "customers": navigate(S.customers); break;
      case "reports":   navigate(S.reports);   break;
      case "settings":  navigate(S.settings);  break;
      default: break;
    }
  }, [reset, navigate]);

  // ── Screen renderer ────────────────────────────────────────────
  const renderScreen = () => {
    const { id, params } = current;

    switch (id) {

      // ── Auth: Login ────────────────────────────────────────────
      case S.login:
        return (
          <Authentication
            mode="login"
            onAuthDone={() => handleAuthDone("login")}
            // The Auth component shows a "Sign Up" link; wire it:
            onSignUp={() => navigate(S.signup)}
          />
        );

      // ── Auth: Sign Up ──────────────────────────────────────────
      case S.signup:
        return (
          <Authentication
            mode="signup"
            onAuthDone={() => handleAuthDone("signup")}
            onSignIn={() => navigate(S.login)}
          />
        );

      // ── Onboarding Wizard (first-run, post-signup) ─────────────
      case S.onboarding:
        return (
          <OnboardingWizard
            onComplete={handleOnboardingComplete}
            onSkip={() => reset(S.home)}
          />
        );

      // ── Home Dashboard ─────────────────────────────────────────
      case S.home:
        return (
          <HomeDashboard
            syncOnline={syncOnline}
            transactions={transactions}
            onNavigate={handleNavigate}
            onAddTransaction={() => navigate(S.keypad)}
            onViewAll={() => navigate(S.customers)}
            onNotification={handleNotification}
            notifCount={notifCount}
            // Payment Reminder shortcut — rendered as a quick-action card
            // HomeDashboard forwards this through its onProfile or a dedicated prop.
            // We add onReminders so HomeDashboard can show the reminder button.
            onReminders={() => {
              // Opens reminder with the most overdue customer (or picker)
              navigate(S.paymentReminder, {
                customer: {
                  name: "Rohit Nair",
                  phone: "+91 95566 77889",
                  initials: "RN",
                  balance: 12200,
                  daysOverdue: 14,
                },
              });
            }}
            onScan={() => navigate(S.scan)}
            onTxnPress={(txn) => navigate(S.transactionDetail, { transaction: txn })}
            onProfile={() => navigate(S.settings)}
          />
        );

      // ── Customers List ─────────────────────────────────────────
      case S.customers:
        return (
          <CustomersList
            onCustomerPress={handleCustomerPress}
            onNavigate={handleNavigate}
            onNotification={handleNotification}
            onBack={goBack}
          />
        );

      // ── Customer Profile ───────────────────────────────────────
      case S.customerProfile:
        return (
          <CustomerProfile
            customer={params?.customer || selectedCustomer}
            onBack={goBack}
            onNavigate={handleNavigate}
            onCredit={(customer) => {
              setSelectedCustomer(customer);
              navigate(S.keypad, { customer });
            }}
            onPayment={(customer) => {
              setSelectedCustomer(customer);
              navigate(S.keypad, { customer });
            }}
            onReminder={(customer) => {
              setSelectedCustomer(customer);
              navigate(S.paymentReminder, { customer });
            }}
            onScore={(customer) => navigate(S.gramScore, { customer })}
            onTxnPress={(txn) => navigate(S.transactionDetail, { transaction: txn })}
          />
        );

      // ── Gram Score Detail ──────────────────────────────────────
      case S.gramScore:
        return (
          <GramScoreDetail
            customer={params?.customer || selectedCustomer}
            onBack={goBack}
            onNavigate={handleNavigate}
            onCredit={(customer) => {
              setSelectedCustomer(customer);
              navigate(S.keypad, { customer });
            }}
            onReminder={(customer) => navigate(S.paymentReminder, { customer })}
            onProfile={(customer) => navigate(S.customerProfile, { customer })}
          />
        );

      // ── Transaction Detail ─────────────────────────────────────
      case S.transactionDetail:
        return (
          <TransactionDetail
            transaction={params?.transaction}
            storeName="Sharma Kirana Store"
            onBack={goBack}
            onNavigate={handleNavigate}
            onUpdate={(updated) => showToast("Transaction updated ✓")}
            onDelete={(id) => {
              showToast("Transaction deleted");
              goBack();
            }}
            onReminder={(customer) => navigate(S.paymentReminder, { customer })}
            onTxnPress={(txn) => navigate(S.transactionDetail, { transaction: txn })}
          />
        );

      // ── Payment Reminder ───────────────────────────────────────
      // Accessible from:
      //   1. HomeDashboard → "Send Reminder" quick-action button
      //   2. CustomerProfile → "Remind" action
      //   3. GramScoreDetail → "Send Reminder" button
      //   4. TransactionDetail → "Remind" action button
      //   5. NotificationsCentre → "Send Reminder" action on overdue cards
      case S.paymentReminder:
        return (
          <PaymentReminder
            customer={params?.customer || selectedCustomer}
            storeName="Sharma Kirana Store"
            onBack={goBack}
            onNavigate={handleNavigate}
            onSent={(data) => {
              showToast(`Reminder sent to ${data.customer?.name} ✓`);
              goBack();
            }}
          />
        );

      // ── Notifications Centre ───────────────────────────────────
      case S.notifications:
        return (
          <NotificationsCentre
            onNavigate={handleNavigate}
            onBack={goBack}
            onActionTap={(action, notif) => {
              if (action === "Send Reminder") {
                navigate(S.paymentReminder, {
                  customer: {
                    name:     notif.meta?.customer  || "Customer",
                    initials: notif.meta?.initials  || "?",
                    balance:  parseInt((notif.meta?.amount || "0").replace(/[₹,]/g, "")) || 0,
                    phone:    "",
                    daysOverdue: 7,
                  },
                });
              } else if (action === "View Profile") {
                navigate(S.customerProfile, {
                  customer: {
                    name:     notif.meta?.customer  || "Customer",
                    initials: notif.meta?.initials  || "?",
                  },
                });
              } else if (action === "View Report") {
                navigate(S.reports);
              }
            }}
          />
        );

      // ── Reports Dashboard ──────────────────────────────────────
      case S.reports:
        return (
          <ReportsDashboard
            onNavigate={handleNavigate}
            onBack={goBack}
            onCustomerPress={handleCustomerPress}
          />
        );

      // ── Scan QR ────────────────────────────────────────────────
      case S.scan:
        return (
          <ScanQR
            onScanSuccess={handleScanSuccess}
            onNavigate={handleNavigate}
            onBack={goBack}
          />
        );

      // ── Transaction Keypad ─────────────────────────────────────
      case S.keypad:
        return (
          <TransactionKeypad
            syncOnline={syncOnline}
            preselectedCustomer={params?.customer || selectedCustomer || null}
            onTransactionDone={handleTransactionDone}
            onNavigate={handleNavigate}
            onScanQR={() => navigate(S.scan)}
          />
        );

      // ── Settings ───────────────────────────────────────────────
      case S.settings:
        return (
          <Settings
            onBack={goBack}
            onNavigate={handleNavigate}
            onNetworkSync={() => navigate(S.networkSync)}
            onSignOut={() => {
              showToast("Signed out");
              reset(S.login);
            }}
          />
        );

      // ── Network Sync ───────────────────────────────────────────
      case S.networkSync:
        return (
          <NetworkSync
            onBack={goBack}
            onNavigate={handleNavigate}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Phone shell — max 420px for desktop preview */}
      <div style={{
        width: "100%",
        maxWidth: 420,
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#F0F2F8",
        boxShadow: "0 0 60px rgba(0,0,0,0.15)",
      }}>
        {/* Animated screen mount — key forces remount on screen change */}
        <div
          key={current.id}
          className={anim}
          style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
        >
          {renderScreen()}
        </div>

        {/* Global toast overlay */}
        <Toast message={toast.message} visible={toast.visible} />
      </div>
    </>
  );
}

/*
 * ─────────────────────────────────────────────────────────────────
 * NAVIGATION MAP  (for reference)
 * ─────────────────────────────────────────────────────────────────
 *
 *  [login]  ──────────────────────────────────────────────────────
 *    onAuthDone (login)   → home
 *    onSignUp             → signup
 *
 *  [signup]  ─────────────────────────────────────────────────────
 *    onAuthDone (signup)  → onboarding
 *    onSignIn             → login
 *
 *  [onboarding]  ─────────────────────────────────────────────────
 *    onComplete           → home (reset stack)
 *    onSkip               → home (reset stack)
 *
 *  [home]  ───────────────────────────────────────────────────────
 *    FAB / keypad button  → keypad
 *    onViewAll            → customers
 *    onNotification       → notifications
 *    onReminders          → paymentReminder  ← NEW dedicated button
 *    onTxnPress(txn)      → transactionDetail ← NEW
 *    onProfile            → settings
 *    bottom nav           → customers / reports / settings
 *
 *  [customers]  ──────────────────────────────────────────────────
 *    onCustomerPress      → customerProfile
 *
 *  [customerProfile]  ────────────────────────────────────────────
 *    onCredit             → keypad
 *    onPayment            → keypad
 *    onReminder           → paymentReminder
 *    onScore              → gramScore
 *    onTxnPress           → transactionDetail
 *
 *  [gramScore]  ──────────────────────────────────────────────────
 *    onCredit             → keypad
 *    onReminder           → paymentReminder
 *    onProfile            → customerProfile
 *
 *  [transactionDetail]  ──────────────────────────────────────────
 *    onReminder           → paymentReminder
 *    onTxnPress           → transactionDetail (same screen, new txn)
 *
 *  [paymentReminder]  ────────────────────────────────────────────
 *    onSent               → goBack + toast
 *
 *  [notifications]  ──────────────────────────────────────────────
 *    "Send Reminder"      → paymentReminder
 *    "View Profile"       → customerProfile
 *    "View Report"        → reports
 *
 *  [keypad]  ─────────────────────────────────────────────────────
 *    onScanQR             → scan
 *    onTransactionDone    → home (reset stack)
 *
 *  [scan]  ───────────────────────────────────────────────────────
 *    onScanSuccess        → keypad
 *
 * ─────────────────────────────────────────────────────────────────
 */