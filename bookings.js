import { Router } from "express";

/** Routes for the `bookings` collection. Add booking endpoints here. */
export const bookingRoutes = (
  bookings,
  verifyToken,
  verifyCustomer,
  verifyTechnician,
  verifyAdmin,
) => {
  const router = Router();

  // Example endpoints to add later:
  // POST  /api/bookings               -> verifyToken, verifyCustomer
  // GET   /api/bookings/my            -> verifyToken, verifyCustomer
  // PATCH /api/bookings/:id/cancel    -> verifyToken, verifyCustomer
  // GET   /api/bookings/technician    -> verifyToken, verifyTechnician
  // PATCH /api/bookings/:id/status    -> verifyToken, verifyTechnician
  // GET   /api/admin/bookings         -> verifyToken, verifyAdmin

  return router;
};
