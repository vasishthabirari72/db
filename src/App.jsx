import { useCallback, useEffect, useRef, useState } from "react";

import Authentication from "./screens/Authentication";
import CustomersList from "./screens/CustomersList";
import CustomerProfile from "./screens/CustomerProfile";
import GramScoreDetail from "./screens/GramScoreDetail";
import HomeDashboard from "./screens/HomeDashboard";
import NetworkSync from "./screens/NetworkSync";
import NotificationsCentre from "./screens/NotificationsCentre";
import OnboardingWizard from "./screens/OnboardingWizard";
import PaymentReminder from "./screens/PaymentReminder";
import ReportsDashboard from "./screens/ReportsDashboard";
import ScanQR from "./screens/ScanQR";
import Settings from "./screens/Settings";
import TransactionDetail from "./screens/TransactionDetail";
import TransactionKeypad from "./screens/TransactionKeypad";

const S = {
  login: "login",
  signup: "signup",
  onboarding: "onboarding",
  home: "home",
  customers: "customers",
  customerProfile: "customerProfile",
  gramScore: "gramScore",
  transactionDetail: "transactionDetail",
  paymentReminder: "paymentReminder",
  reports: "reports",
  notifications: "notifications",
  scan: "scan",
  keypad: "keypad",
  settings: "settings",
  networkSync: "networkSync",
};

const SCREEN_ORDER = [
  S.login,
  S.signup,
  S.onboarding,
  S.home,
  S.customers,
  S.customerProfile,
  S.gramScore,
  S.transactionDetail,
  S.paymentReminder,
  S.notifications,
  S.reports,
  S.scan,
  S.keypad,
  S.settings,
  S.networkSync,
];

const SCREEN_PATHS = {
  [S.login]: "/",
  [S.signup]: "/signup",
  [S.onboarding]: "/onboarding",
  [S.home]: "/home",
  [S.customers]: "/customers",
  [S.customerProfile]: "/customers/profile",
  [S.gramScore]: "/customers/gram-score",
  [S.transactionDetail]: "/transactions/detail",
  [S.paymentReminder]: "/reminders/payment",
  [S.reports]: "/reports",
  [S.notifications]: "/notifications",
  [S.scan]: "/scan",
  [S.keypad]: "/transactions/keypad",
  [S.settings]: "/settings",
  [S.networkSync]: "/settings/network-sync",
};

const BASE_PATH = normaliseBasePath(import.meta.env.BASE_URL || "/");
const TRANSITION_MS = 220;

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
  .app-shell {
    width: 100%;
    max-width: 420px;
    height: 100dvh;
    position: relative;
    overflow: auto;
    background: #F0F2F8;
  }
  @media (min-width: 481px) {
    .app-shell {
      box-shadow: 0 0 60px rgba(0,0,0,0.15);
    }
  }
  @media (max-width: 480px) {
    body {
      justify-content: stretch;
    }
    .app-shell {
      max-width: 100vw;
      box-shadow: none;
    }
  }
  ::-webkit-scrollbar { display: none; }

  @keyframes slideInRight {
    from { transform: translateX(32px); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideInLeft {
    from { transform: translateX(-32px); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideInUp {
    from { transform: translateY(24px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  @keyframes fadeScreen {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .screen-enter-right { animation: slideInRight ${TRANSITION_MS}ms cubic-bezier(.22,1,.36,1) forwards; }
  .screen-enter-left  { animation: slideInLeft ${TRANSITION_MS}ms cubic-bezier(.22,1,.36,1) forwards; }
  .screen-enter-up    { animation: slideInUp ${TRANSITION_MS}ms cubic-bezier(.22,1,.36,1) forwards; }
  .screen-enter-fade  { animation: fadeScreen ${TRANSITION_MS}ms ease forwards; }
`;

function normaliseBasePath(basePath) {
  if (!basePath || basePath === "/") {
    return "";
  }

  return `/${basePath.replace(/^\/+|\/+$/g, "")}`;
}

function withBasePath(pathname) {
  if (!BASE_PATH) {
    return pathname === "/" ? "/" : pathname;
  }

  return pathname === "/" ? `${BASE_PATH}/` : `${BASE_PATH}${pathname}`;
}

function stripBasePath(pathname) {
  if (!BASE_PATH) {
    return pathname || "/";
  }

  if (pathname === BASE_PATH || pathname === `${BASE_PATH}/`) {
    return "/";
  }

  if (pathname.startsWith(`${BASE_PATH}/`)) {
    return pathname.slice(BASE_PATH.length) || "/";
  }

  return pathname || "/";
}

function makeInitials(name = "Customer") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CU";
}

function parseCurrencyValue(value) {
  if (typeof value === "number") {
    return value;
  }

  if (!value) {
    return 0;
  }

  if (typeof value === "string" && /cleared/i.test(value)) {
    return 0;
  }

  const numericValue = String(value).replace(/[^\d.-]/g, "");
  return numericValue ? Number(numericValue) : 0;
}

function formatCurrency(value) {
  return `\u20B9${Number(value || 0).toLocaleString("en-IN")}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function deriveStatusFromScore(score, maxScore = 900) {
  const pct = maxScore ? (score / maxScore) * 100 : 0;

  if (pct >= 70) {
    return "safe";
  }

  if (pct >= 45) {
    return "caution";
  }

  return "high-risk";
}

function deriveCreditLimit(balance, score, maxScore) {
  const scoreDrivenLimit = Math.round(((score || 0) / (maxScore || 900)) * 7000);
  const suggestedLimit = Math.max(balance * 2, scoreDrivenLimit, 3000);
  return Math.ceil(suggestedLimit / 500) * 500;
}

function createCustomerId(name) {
  const seed = name
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)
    .toString()
    .slice(0, 4);

  return `GS-${seed.padStart(4, "0")}`;
}

function normaliseCustomer(rawCustomer = {}) {
  const name = rawCustomer.name || "Walk-in Customer";
  const gramScore = rawCustomer.gramScore ?? rawCustomer.score ?? 620;
  const maxScore = rawCustomer.maxScore ?? 900;
  const balance = rawCustomer.balance ?? parseCurrencyValue(rawCustomer.balanceLabel);
  const status = rawCustomer.status || deriveStatusFromScore(gramScore, maxScore);
  const creditLimit = rawCustomer.creditLimit ?? deriveCreditLimit(balance, gramScore, maxScore);
  const totalUdhar = rawCustomer.totalUdhar ?? Math.max(balance + Math.round(creditLimit * 0.35), balance);
  const totalJama = rawCustomer.totalJama ?? Math.max(totalUdhar - balance, 0);
  const lastActivity = rawCustomer.lastActivity || rawCustomer.balanceSub || "Today";

  return {
    id: rawCustomer.id || createCustomerId(name),
    name,
    phone: rawCustomer.phone || "",
    initials: rawCustomer.initials || makeInitials(name),
    since: rawCustomer.since || rawCustomer.memberSince || "July 2023",
    memberSince: rawCustomer.memberSince || rawCustomer.since || "July 2023",
    address: rawCustomer.address || "12, Gandhi Nagar, Nashik",
    gramScore,
    score: gramScore,
    maxScore,
    status,
    creditLimit,
    totalUdhar,
    totalJama,
    balance,
    balanceType: rawCustomer.balanceType || "udhar",
    balanceLabel: rawCustomer.balanceLabel || formatCurrency(balance),
    balanceSub: rawCustomer.balanceSub || lastActivity,
    balanceSubColor: rawCustomer.balanceSubColor || (status === "high-risk" ? "#E8304A" : "#7A85A3"),
    balanceColor: rawCustomer.balanceColor || (status === "high-risk" ? "#E8304A" : "#0D1226"),
    daysOverdue: rawCustomer.daysOverdue ?? (status === "high-risk" ? 14 : status === "caution" ? 5 : 0),
    lastActivity,
  };
}

function normaliseTransaction(rawTransaction = {}, fallbackCustomer) {
  const customerSource = rawTransaction.customer || fallbackCustomer || {
    name: rawTransaction.name,
    phone: rawTransaction.phone,
    initials: rawTransaction.initials,
  };
  const customer = normaliseCustomer(customerSource);
  const type = String(rawTransaction.type || "").toLowerCase() === "jama" ? "jama" : "udhar";
  const amount = parseCurrencyValue(rawTransaction.amount);
  const rawTime = rawTransaction.time;
  const createdAt = rawTransaction.createdAt
    || (rawTime instanceof Date
      ? rawTime.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
      : rawTime || "Just now");

  return {
    id: rawTransaction.id || `TXN-${Date.now()}`,
    type,
    amount,
    description: rawTransaction.description || rawTransaction.label || (type === "jama" ? "Payment Received" : "Credit Given"),
    note: rawTransaction.note || "",
    category: rawTransaction.category || "groceries",
    status: rawTransaction.status || (rawTransaction.synced ? "synced" : "pending"),
    synced: rawTransaction.synced ?? true,
    disputed: rawTransaction.disputed ?? false,
    paid: rawTransaction.paid ?? false,
    customer,
    store: rawTransaction.store || "Sharma Kirana Store",
    storeId: rawTransaction.storeId || "GS-ST-4421",
    createdAt,
    editedAt: rawTransaction.editedAt || null,
    syncedAt: rawTransaction.syncedAt || null,
    time: rawTime || createdAt,
    name: rawTransaction.name || customer.name,
    initials: rawTransaction.initials || customer.initials,
    label: rawTransaction.label || rawTransaction.description || (type === "jama" ? "Payment Received" : "Credit Given"),
  };
}

function buildScoreData(customer) {
  const resolvedCustomer = normaliseCustomer(customer);
  const scorePct = resolvedCustomer.maxScore
    ? (resolvedCustomer.gramScore / resolvedCustomer.maxScore) * 100
    : 0;
  const repayment = clamp(Math.round(scorePct + 8), 32, 95);
  const frequency = clamp(Math.round(scorePct + (resolvedCustomer.daysOverdue > 0 ? -5 : 10)), 28, 92);
  const history = clamp(Math.round(scorePct - 4), 25, 88);
  const balance = clamp(
    Math.round(100 - ((resolvedCustomer.balance / Math.max(resolvedCustomer.creditLimit, 1)) * 100) + 18),
    20,
    90,
  );

  return {
    score: resolvedCustomer.gramScore,
    max: resolvedCustomer.maxScore,
    updated: resolvedCustomer.lastActivity || "Today",
    factors: {
      repayment,
      frequency,
      history,
      balance,
    },
    networkPercentile: clamp(Math.round(scorePct) - 6, 8, 96),
    history: Array.from({ length: 6 }, (_, index) => clamp(
      Math.round(resolvedCustomer.gramScore - ((5 - index) * 24)),
      300,
      resolvedCustomer.maxScore,
    )),
    historyLabels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
  };
}

function getTransitionClass(from, to) {
  if (to === S.scan) {
    return "screen-enter-up";
  }

  if (to === S.keypad && from === S.scan) {
    return "screen-enter-left";
  }

  if (to === S.login || to === S.signup) {
    return "screen-enter-fade";
  }

  const fromIndex = SCREEN_ORDER.indexOf(from);
  const toIndex = SCREEN_ORDER.indexOf(to);

  if (fromIndex === -1 || toIndex === -1) {
    return "screen-enter-fade";
  }

  return toIndex > fromIndex ? "screen-enter-right" : "screen-enter-left";
}

function resolveRoute(initialScreen) {
  const historyState = window.history.state;
  const screenFromPath = Object.entries(SCREEN_PATHS).find(([, path]) => path === stripBasePath(window.location.pathname))?.[0];
  const screenId = historyState?.screenId || screenFromPath || initialScreen;

  return {
    id: screenId,
    params: historyState?.params || {},
    appIndex: Number.isInteger(historyState?.appIndex) ? historyState.appIndex : 0,
  };
}

function useRouter(initialScreen) {
  const initialRouteRef = useRef(null);

  if (!initialRouteRef.current) {
    initialRouteRef.current = resolveRoute(initialScreen);
  }

  const [current, setCurrent] = useState(initialRouteRef.current);
  const [anim, setAnim] = useState("screen-enter-fade");
  const currentRef = useRef(initialRouteRef.current);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    const initialRoute = initialRouteRef.current;
    window.history.replaceState(
      {
        screenId: initialRoute.id,
        params: initialRoute.params,
        appIndex: initialRoute.appIndex,
      },
      "",
      withBasePath(SCREEN_PATHS[initialRoute.id] || SCREEN_PATHS[initialScreen]),
    );

    const handlePopState = (event) => {
      const nextRoute = event.state?.screenId
        ? {
          id: event.state.screenId,
          params: event.state.params || {},
          appIndex: Number.isInteger(event.state.appIndex) ? event.state.appIndex : 0,
        }
        : resolveRoute(initialScreen);

      setAnim(getTransitionClass(currentRef.current.id, nextRoute.id));
      currentRef.current = nextRoute;
      setCurrent(nextRoute);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [initialScreen]);

  const commit = useCallback((method, screenId, params = {}) => {
    const previousRoute = currentRef.current;
    const nextRoute = {
      id: screenId,
      params,
      appIndex: method === "push" ? previousRoute.appIndex + 1 : previousRoute.appIndex,
    };

    setAnim(getTransitionClass(previousRoute.id, screenId));
    window.history[method === "push" ? "pushState" : "replaceState"](
      {
        screenId,
        params,
        appIndex: nextRoute.appIndex,
      },
      "",
      withBasePath(SCREEN_PATHS[screenId] || SCREEN_PATHS[initialScreen]),
    );
    currentRef.current = nextRoute;
    setCurrent(nextRoute);
  }, [initialScreen]);

  const navigate = useCallback((screenId, params = {}) => {
    commit("push", screenId, params);
  }, [commit]);

  const replace = useCallback((screenId, params = {}) => {
    commit("replace", screenId, params);
  }, [commit]);

  const reset = replace;

  const goBack = useCallback((fallbackScreenId = initialScreen, fallbackParams = {}) => {
    if (currentRef.current.appIndex > 0) {
      window.history.back();
      return;
    }

    commit("replace", fallbackScreenId, fallbackParams);
  }, [commit, initialScreen]);

  return { current, anim, navigate, replace, reset, goBack };
}

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
  const [toast, setToast] = useState({ message: "", visible: false });
  const timerRef = useRef(null);

  const show = useCallback((message) => {
    clearTimeout(timerRef.current);
    setToast({ message, visible: true });
    timerRef.current = setTimeout(() => {
      setToast((currentToast) => ({ ...currentToast, visible: false }));
    }, 2600);
  }, []);

  return { toast, show };
}

export default function App() {
  const router = useRouter(S.login);
  const { current, anim, navigate, replace, reset, goBack } = router;
  const { toast, show: showToast } = useToast();

  const [syncOnline, setSyncOnline] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [notifCount, setNotifCount] = useState(3);

  const addTransaction = useCallback((transaction) => {
    const normalisedTransaction = normaliseTransaction(transaction, transaction?.customer || selectedCustomer);
    setTransactions((currentTransactions) => [normalisedTransaction, ...currentTransactions]);
  }, [selectedCustomer]);

  const handleTransactionPress = useCallback((transaction, fallbackCustomer) => {
    navigate(S.transactionDetail, {
      transaction: normaliseTransaction(transaction, fallbackCustomer || selectedCustomer),
    });
  }, [navigate, selectedCustomer]);

  const handleAuthDone = useCallback((mode) => {
    if (mode === "signup") {
      replace(S.onboarding);
      return;
    }

    reset(S.home);
  }, [replace, reset]);

  const handleOnboardingComplete = useCallback((storeData) => {
    showToast(`Welcome, ${storeData.storeName}`);
    reset(S.home);
  }, [reset, showToast]);

  const handleTransactionDone = useCallback((transaction) => {
    const normalisedTransaction = normaliseTransaction(transaction, transaction?.customer || selectedCustomer);
    addTransaction(normalisedTransaction);
    showToast(
      `${formatCurrency(normalisedTransaction.amount)} ${normalisedTransaction.type === "udhar" ? "credit" : "payment"} recorded \u2713`,
    );
    reset(S.home);
  }, [addTransaction, reset, selectedCustomer, showToast]);

  const handleScanSuccess = useCallback((customer) => {
    const normalisedCustomer = normaliseCustomer(customer);
    setSelectedCustomer(normalisedCustomer);
    navigate(S.keypad, { customer: normalisedCustomer });
    showToast(`${normalisedCustomer.name} verified \u2713`);
  }, [navigate, showToast]);

  const handleCustomerPress = useCallback((customer) => {
    const normalisedCustomer = normaliseCustomer(customer);
    setSelectedCustomer(normalisedCustomer);
    navigate(S.customerProfile, { customer: normalisedCustomer });
  }, [navigate]);

  const handleNotification = useCallback(() => {
    setNotifCount(0);
    navigate(S.notifications);
  }, [navigate]);

  const handleTabNavigation = useCallback((screenId) => {
    const tabTargets = {
      home: S.home,
      customers: S.customers,
      reports: S.reports,
      settings: S.settings,
    };
    const target = tabTargets[screenId];

    if (!target || target === current.id) {
      return;
    }

    if ([S.home, S.customers, S.reports, S.settings].includes(current.id)) {
      replace(target);
      return;
    }

    navigate(target);
  }, [current.id, navigate, replace]);

  const renderScreen = () => {
    const currentCustomer = current.params?.customer || selectedCustomer;
    const resolvedCustomer = currentCustomer ? normaliseCustomer(currentCustomer) : undefined;
    const resolvedTransaction = current.params?.transaction
      ? normaliseTransaction(current.params.transaction, resolvedCustomer || selectedCustomer)
      : undefined;

    switch (current.id) {
      case S.login:
        return (
          <Authentication
            mode="login"
            onAuthDone={() => handleAuthDone("login")}
            onSignUp={() => navigate(S.signup)}
          />
        );

      case S.signup:
        return (
          <Authentication
            mode="signup"
            onAuthDone={() => handleAuthDone("signup")}
            onSignIn={() => navigate(S.login)}
          />
        );

      case S.onboarding:
        return (
          <OnboardingWizard
            onComplete={handleOnboardingComplete}
            onSkip={() => reset(S.home)}
          />
        );

      case S.home:
        return (
          <HomeDashboard
            syncOnline={syncOnline}
            transactions={transactions}
            onNavigate={handleTabNavigation}
            onAddTransaction={() => navigate(S.keypad)}
            onViewAll={() => navigate(S.customers)}
            onNotification={handleNotification}
            notifCount={notifCount}
            onReminders={() => {
              const reminderCustomer = normaliseCustomer({
                name: "Rohit Nair",
                phone: "+91 95566 77889",
                initials: "RN",
                balance: 12200,
                daysOverdue: 14,
                score: 245,
                maxScore: 900,
                status: "high-risk",
                balanceLabel: formatCurrency(12200),
                balanceSub: "Defaulter",
              });
              setSelectedCustomer(reminderCustomer);
              navigate(S.paymentReminder, { customer: reminderCustomer });
            }}
            onTxnPress={(transaction) => handleTransactionPress(transaction)}
            onProfile={() => navigate(S.settings)}
          />
        );

      case S.customers:
        return (
          <CustomersList
            onCustomerPress={handleCustomerPress}
            onNavigate={handleTabNavigation}
            onNotification={handleNotification}
            onBack={() => goBack(S.home)}
          />
        );

      case S.customerProfile:
        return (
          <CustomerProfile
            customer={resolvedCustomer}
            onBack={() => goBack(S.customers)}
            onNavigate={handleTabNavigation}
            onCredit={(customer) => {
              const nextCustomer = normaliseCustomer(customer);
              setSelectedCustomer(nextCustomer);
              navigate(S.keypad, { customer: nextCustomer });
            }}
            onPayment={(customer) => {
              const nextCustomer = normaliseCustomer(customer);
              setSelectedCustomer(nextCustomer);
              navigate(S.keypad, { customer: nextCustomer });
            }}
            onReminder={(customer) => {
              const nextCustomer = normaliseCustomer(customer);
              setSelectedCustomer(nextCustomer);
              navigate(S.paymentReminder, { customer: nextCustomer });
            }}
            onScore={(customer) => {
              const nextCustomer = normaliseCustomer(customer);
              setSelectedCustomer(nextCustomer);
              navigate(S.gramScore, { customer: nextCustomer });
            }}
            onTxnPress={(transaction) => handleTransactionPress(transaction, resolvedCustomer)}
          />
        );

      case S.gramScore:
        return (
          <GramScoreDetail
            customer={resolvedCustomer}
            scoreData={resolvedCustomer ? buildScoreData(resolvedCustomer) : undefined}
            onBack={() => goBack(S.customerProfile)}
            onNavigate={handleTabNavigation}
            onCredit={(customer) => {
              const nextCustomer = normaliseCustomer(customer);
              setSelectedCustomer(nextCustomer);
              navigate(S.keypad, { customer: nextCustomer });
            }}
            onReminder={(customer) => {
              const nextCustomer = normaliseCustomer(customer);
              setSelectedCustomer(nextCustomer);
              navigate(S.paymentReminder, { customer: nextCustomer });
            }}
            onProfile={(customer) => {
              const nextCustomer = normaliseCustomer(customer);
              setSelectedCustomer(nextCustomer);
              navigate(S.customerProfile, { customer: nextCustomer });
            }}
          />
        );

      case S.transactionDetail:
        return (
          <TransactionDetail
            transaction={resolvedTransaction}
            storeName="Sharma Kirana Store"
            onBack={() => goBack(resolvedCustomer ? S.customerProfile : S.home)}
            onNavigate={handleTabNavigation}
            onUpdate={() => showToast("Transaction updated \u2713")}
            onDelete={() => showToast("Transaction deleted")}
            onReminder={(customer) => {
              const nextCustomer = normaliseCustomer(customer);
              setSelectedCustomer(nextCustomer);
              navigate(S.paymentReminder, { customer: nextCustomer });
            }}
            onTxnPress={(transaction) => handleTransactionPress(transaction, resolvedCustomer)}
          />
        );

      case S.paymentReminder:
        return (
          <PaymentReminder
            customer={resolvedCustomer}
            storeName="Sharma Kirana Store"
            onBack={() => goBack(resolvedCustomer ? S.customerProfile : S.home)}
            onNavigate={handleTabNavigation}
            onSent={(data) => {
              showToast(`Reminder sent to ${data.customer?.name} \u2713`);
              goBack(resolvedCustomer ? S.customerProfile : S.home);
            }}
          />
        );

      case S.notifications:
        return (
          <NotificationsCentre
            onNavigate={handleTabNavigation}
            onBack={() => goBack(S.home)}
            onActionTap={(action, notification) => {
              if (action === "Send Reminder") {
                const nextCustomer = normaliseCustomer({
                  name: notification.meta?.customer || "Customer",
                  initials: notification.meta?.initials || "?",
                  balance: parseCurrencyValue(notification.meta?.amount),
                  phone: "",
                  daysOverdue: 7,
                });
                setSelectedCustomer(nextCustomer);
                navigate(S.paymentReminder, { customer: nextCustomer });
                return;
              }

              if (action === "View Profile") {
                const nextCustomer = normaliseCustomer({
                  name: notification.meta?.customer || "Customer",
                  initials: notification.meta?.initials || "?",
                });
                setSelectedCustomer(nextCustomer);
                navigate(S.customerProfile, { customer: nextCustomer });
                return;
              }

              if (action === "View Report") {
                navigate(S.reports);
              }
            }}
          />
        );

      case S.reports:
        return (
          <ReportsDashboard
            onNavigate={handleTabNavigation}
            onBack={() => goBack(S.home)}
            onCustomerPress={handleCustomerPress}
          />
        );

      case S.scan:
        return (
          <ScanQR
            onScanSuccess={handleScanSuccess}
            onNavigate={handleTabNavigation}
            onBack={() => goBack(S.keypad)}
          />
        );

      case S.keypad:
        return (
          <TransactionKeypad
            syncOnline={syncOnline}
            preselectedCustomer={resolvedCustomer || selectedCustomer || null}
            onTransactionDone={handleTransactionDone}
            onNavigate={handleTabNavigation}
            onScanQR={() => navigate(S.scan)}
          />
        );

      case S.settings:
        return (
          <Settings
            onBack={() => goBack(S.home)}
            onNavigate={handleTabNavigation}
            onNetworkSync={() => navigate(S.networkSync)}
            onSignOut={() => {
              showToast("Signed out");
              reset(S.login);
            }}
          />
        );

      case S.networkSync:
        return (
          <NetworkSync
            onBack={() => goBack(S.settings)}
            onNavigate={handleTabNavigation}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div className="app-shell">
        <div
          key={`${current.id}-${current.appIndex}`}
          className={anim}
          style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
        >
          {renderScreen()}
        </div>

        <Toast message={toast.message} visible={toast.visible} />
      </div>
    </>
  );
}
