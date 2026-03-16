import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

import * as AuthController from "../controllers/auth.controller.js";
import * as MerchantController from "../controllers/merchants.controller.js";
import * as CustomerController from "../controllers/customers.controller.js";
import * as TxnController from "../controllers/transactions.controller.js";
import * as ScoreController from "../controllers/score.controller.js";
import * as NotifController from "../controllers/notifications.controller.js";
import * as ReportController from "../controllers/reports.controller.js";

import { sendOtpSchema, verifyOtpSchema, setPinSchema } from "../validators/auth.schema.js";
import { createCustomerSchema, updateCustomerSchema } from "../validators/customer.schema.js";
import { createTxnSchema, updateTxnSchema, syncBatchSchema } from "../validators/transaction.schema.js";

/* -------------------------------------------------- */
/* AUTH ROUTES */
/* -------------------------------------------------- */

export const authRouter = Router();

authRouter.post("/send-otp", authLimiter, validate(sendOtpSchema), AuthController.sendOtp);
authRouter.post("/verify-otp", authLimiter, validate(verifyOtpSchema), AuthController.verifyOtp);
authRouter.post("/set-pin", authLimiter, validate(setPinSchema), AuthController.setPin);
authRouter.post("/verify-pin", authLimiter, AuthController.verifyPin);
authRouter.post("/refresh", AuthController.refreshToken);
authRouter.post("/logout", AuthController.logout);

/* -------------------------------------------------- */
/* MERCHANT ROUTES */
/* -------------------------------------------------- */

export const merchantRouter = Router();

merchantRouter.get("/me", MerchantController.getMe);
merchantRouter.put("/me", MerchantController.updateMe);
merchantRouter.post("/onboarding", MerchantController.completeOnboarding);
merchantRouter.get("/qr-card", MerchantController.getQRCard);

/* -------------------------------------------------- */
/* CUSTOMER ROUTES */
/* -------------------------------------------------- */

export const customerRouter = Router();

customerRouter.get("/", CustomerController.list);
customerRouter.post("/", validate(createCustomerSchema), CustomerController.create);
customerRouter.get("/:id", CustomerController.get);
customerRouter.put("/:id", validate(updateCustomerSchema), CustomerController.update);
customerRouter.delete("/:id", CustomerController.remove);
customerRouter.get("/:id/score", CustomerController.getScore);
customerRouter.get("/:id/transactions", CustomerController.getTransactions);
customerRouter.get("/:id/reminders", CustomerController.getReminders);

/* -------------------------------------------------- */
/* TRANSACTION ROUTES */
/* -------------------------------------------------- */

export const txnRouter = Router();

txnRouter.get("/", TxnController.list);
txnRouter.post("/", validate(createTxnSchema), TxnController.create);
txnRouter.get("/:id", TxnController.get);
txnRouter.put("/:id", validate(updateTxnSchema), TxnController.update);
txnRouter.delete("/:id", TxnController.remove);
txnRouter.post("/:id/mark-paid", TxnController.markPaid);
txnRouter.post("/:id/dispute", TxnController.dispute);
txnRouter.post("/sync", validate(syncBatchSchema), TxnController.syncBatch);

/* -------------------------------------------------- */
/* SCORE ROUTES */
/* -------------------------------------------------- */

export const scoreRouter = Router();

scoreRouter.get("/:customerId", ScoreController.getScore);
scoreRouter.post("/:customerId/recalculate", ScoreController.recalculate);
scoreRouter.get("/:customerId/history", ScoreController.getHistory);

/* -------------------------------------------------- */
/* NOTIFICATION ROUTES */
/* -------------------------------------------------- */

export const notifRouter = Router();

notifRouter.get("/", NotifController.list);
notifRouter.patch("/:id/read", NotifController.markRead);
notifRouter.post("/mark-all-read", NotifController.markAllRead);
notifRouter.delete("/:id", NotifController.remove);
notifRouter.post("/send-reminder", NotifController.sendReminder);

/* -------------------------------------------------- */
/* REPORT ROUTES */
/* -------------------------------------------------- */

export const reportRouter = Router();

reportRouter.get("/summary", ReportController.summary);
reportRouter.get("/cashflow", ReportController.cashflow);
reportRouter.get("/top-balances", ReportController.topBalances);
reportRouter.get("/export", ReportController.exportCsv);

/* -------------------------------------------------- */
/* MASTER ROUTER */
/* -------------------------------------------------- */

const router = Router();

router.use("/auth", authRouter);
router.use("/merchants", authenticate, merchantRouter);
router.use("/customers", authenticate, customerRouter);
router.use("/transactions", authenticate, txnRouter);
router.use("/score", authenticate, scoreRouter);
router.use("/notifications", authenticate, notifRouter);
router.use("/reports", authenticate, reportRouter);

export default router;