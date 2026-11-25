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
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid request id" });
      }

      const nextStatus = String(req.body.status || "").trim();
      const allowed = ["accepted", "rejected", "in-progress", "completed"];
      if (!allowed.includes(nextStatus)) {
        return res.status(400).send({ message: "Invalid status transition" });
      }

      const booking = await bookings.findOne({
        _id: new ObjectId(id),
        technicianEmail: req.user.email,
      });

      if (!booking) {
        return res.status(404).send({ message: "Request not found" });
      }

      const current = String(booking.status || "");
      if (current === "cancelled" || current === "rejected") {
        return res.status(400).send({ message: "Cannot change a cancelled or rejected job" });
      }

      const isValidTransition =
        (current === "requested" && (nextStatus === "accepted" || nextStatus === "rejected")) ||
        (current === "accepted" && nextStatus === "in-progress") ||
        (current === "in-progress" && nextStatus === "completed");

      if (!isValidTransition) {
        return res.status(400).send({
          message: `Invalid status transition from ${current} to ${nextStatus}`,
        });
      }

      const update = { status: nextStatus };

      if (nextStatus === "completed") {
        const finalAmount = Number(req.body.finalAmount);
        if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
          return res.status(400).send({
            message: "A valid finalAmount greater than 0 is required to complete a job",
          });
        }
        update.finalAmount = finalAmount;
      }

      const updated = await bookings.findOneAndUpdate(
        { _id: booking._id, status: current },
        { $set: update },
        { returnDocument: "after" },
      );

      if (!updated) {
        return res.status(409).send({ message: "Booking status changed. Please refresh." });
      }

      res.send(updated);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Could not update request status" });
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
