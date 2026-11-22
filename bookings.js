import { Router } from "express";
import { ObjectId } from "mongodb";

/** Routes for the `bookings` collection. */
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

  router.post("/", verifyToken, verifyCustomer, async (req, res) => {
    const bookingData = req.body;
    try {
      const result = await bookings.insertOne(bookingData);
      res.status(201).send(result);
    } catch (error) {
      res.status(500).json({ message: "Error creating booking", error: error.message });
    }
  });

  router.get("/my", verifyToken, verifyCustomer, async (req, res) => {
    try {
      const myBookings = await bookings
        .find({ customerEmail: req.user.email })
        .sort({ _id: -1 })
        .toArray();
      res.send(myBookings);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Could not fetch bookings" });
    }
  });

  router.patch("/:id/cancel", verifyToken, verifyCustomer, async (req, res) => {
    try {
      const cancelled = await bookings.findOneAndUpdate(
        {
          _id: new ObjectId(req.params.id),
          customerEmail: req.user.email,
          status: { $in: ["requested", "accepted"] },
        },
        { $set: { status: "cancelled" } },
        { returnDocument: "after" },
      );

      if (!cancelled) {
        return res.status(404).send({ message: "Booking not found or cannot be cancelled" });
      }

      res.send(cancelled);
    } catch {
      res.status(400).send({ message: "Invalid booking id" });
    }
  });

  return router;
};
