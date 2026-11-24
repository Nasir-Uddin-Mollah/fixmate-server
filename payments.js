import { Router } from "express";

export const paymentRoutes = (payments, verifyToken, verifyCustomer, verifyAdmin) => {
  const router = Router();

  router.get("/my", verifyToken, verifyCustomer, async (req, res) => {
    try {
      const result = await payments
        .find({ customerEmail: req.user.email })
        .sort({ paidAt: -1 })
        .toArray();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payments", error: error.message });
    }
  });

  router.get("/admin/all", verifyToken, verifyAdmin, async (req, res) => {
    try {
      const result = await payments.find().sort({ paidAt: -1 }).toArray();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions", error: error.message });
    }
  });

  return router;
};
