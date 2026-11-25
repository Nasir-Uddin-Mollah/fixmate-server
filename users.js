import { Router } from "express";
import { ObjectId } from "mongodb";

export const userRoutes = (users, verifyToken, verifyAdmin, bookings, services) => {
  const router = Router();

  router.patch("/profile", verifyToken, async (req, res) => {
    try {
      const email = String(req.user?.email || "").trim().toLowerCase();
      if (!email) {
        return res.status(401).send({ message: "Unauthorized" });
      }

      const allowed = ["name", "phone", "area", "bio", "image"];
      const update = {};

      for (const key of allowed) {
        if (req.body[key] === undefined) continue;
        if (key === "image") {
          update.image = req.body.image ? String(req.body.image) : null;
        } else {
          update[key] = String(req.body[key]).trim();
        }
      }

      if (Object.keys(update).length === 0) {
        return res.status(400).send({ message: "No valid profile fields provided" });
      }

      if (update.name === "") {
        return res.status(400).send({ message: "Name is required" });
      }

      const updated = await users.findOneAndUpdate(
        { email },
        { $set: update },
        { returnDocument: "after" },
      );

      if (!updated) {
        return res.status(404).send({ message: "User not found" });
      }

      if (update.name) {
        const syncName = String(update.name).trim();
        const tasks = [];
        if (bookings) {
          tasks.push(
            bookings.updateMany({ customerEmail: email }, { $set: { customerName: syncName } }),
            bookings.updateMany({ technicianEmail: email }, { $set: { technicianName: syncName } }),
          );
        }
        if (services) {
          tasks.push(
            services.updateMany({ technicianEmail: email }, { $set: { technicianName: syncName } }),
          );
        }
        await Promise.all(tasks);
      }

      res.send(updated);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Could not update profile" });
    }
  });

  router.get("/admin/all", verifyToken, verifyAdmin, async (req, res) => {
    try {
      const allUsers = await users.find({}).sort({ createdAt: -1 }).toArray();
      res.send(allUsers);
    } catch {
      res.status(500).send({ message: "Could not fetch users" });
    }
  });

  router.patch("/:id/role", verifyToken, verifyAdmin, async (req, res) => {
    try {
      const {role} = req.body;
      const allowed = ["customer", "technician", "admin"];

      if (!allowed.includes(role)) {
        return res.status(400).send({ message: "Invalid role" });
      }

      const updated = await users.findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: { role } },
        { returnDocument: "after" },
      );

      if (!updated) {
        return res.status(404).send({ message: "User not found" });
      }

      res.send(updated);
    } catch {
      res.status(400).send({ message: "Invalid user id" });
    }
  });

  return router;
};
