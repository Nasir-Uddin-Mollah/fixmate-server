import { Router } from "express";

/** Routes for the `users` collection. Add user/profile endpoints here. */
export const userRoutes = (users, verifyToken, verifyAdmin) => {
  const router = Router();

  // Example endpoints to add later:
  // GET  /api/users/profile          -> verifyToken
  // PATCH /api/users/profile         -> verifyToken
  // GET  /api/admin/users            -> verifyToken, verifyAdmin
  // PATCH /api/admin/users/:id/role  -> verifyToken, verifyAdmin

  return router;
};
