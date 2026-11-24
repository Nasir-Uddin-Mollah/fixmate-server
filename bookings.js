import { Router } from "express";
import { ObjectId } from "mongodb";

export const bookingRoutes = (
  bookings,
  verifyToken,
  verifyCustomer,
  verifyTechnician,
  verifyAdmin,
) => {
  const router = Router();

  router.post("/", verifyToken, verifyCustomer, async (req, res) => {
    try {
      const { serviceId } = req.body;
      if (!serviceId) {
        return res.status(400).send({ message: "serviceId is required" });
      }

      const existing = await bookings.findOne({
        customerEmail: req.user.email,
        serviceId: serviceId,
        status: { $in: ["requested", "accepted", "in-progress"] },
      });

      if (existing) {
        return res.status(400).send({
          message: "You already have an active request for this service",
        });
      }

      const bookingData = {
        ...req.body,
        customerEmail: req.user.email,
        customerName: req.user.name,
        status: "requested",
        createdAt: new Date(),
      };

      const result = await bookings.insertOne(bookingData);
      res.status(201).send({ ...bookingData, _id: result.insertedId });
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

  router.get("/technician", verifyToken, verifyTechnician, async (req, res) => {
    try {
      const requests = await bookings
        .find({ technicianEmail: req.user.email })
        .sort({ _id: -1 })
        .toArray();
      res.send(requests);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Could not fetch requests" });
    }
  });

  router.patch("/:id/status", verifyToken, verifyTechnician, async (req, res) => {
    try {
      const update = { status: req.body.status };

      if (typeof req.body.finalAmount === "number") {
        update.finalAmount = req.body.finalAmount;
      }

      const updated = await bookings.findOneAndUpdate(
        {
          _id: new ObjectId(req.params.id),
          technicianEmail: req.user.email,
        },
        { $set: update },
        { returnDocument: "after" },
      );

      if (!updated) {
        return res.status(404).send({ message: "Request not found" });
      }

      res.send(updated);
    } catch {
      res.status(400).send({ message: "Invalid request id" });
    }
  });

  router.get("/admin/all", verifyToken, verifyAdmin, async (req, res) => {
    try{
      const allBookings = await bookings.find().sort({_id: -1}).toArray();
      res.send(allBookings);
    }catch(error){
      res.status(500).json({ message: "Error fetching bookings", error: error.message });
    }
  })

  return router;
};
