import { Router } from "express";

/** Routes for the `payments` collection. Add Stripe/payment endpoints here. */
export const paymentRoutes = (payments, verifyToken, verifyCustomer) => {
  const router = Router();

  // Example endpoints to add later:
  // POST /api/payments/create-checkout-session -> verifyToken, verifyCustomer
  // GET  /api/payments/verify                  -> verifyToken, verifyCustomer
  // GET  /api/admin/payments                   -> verifyToken, verifyAdmin
  // POST /api/payments/webhook                 -> Stripe signature (no JWT)

  return router;
};
