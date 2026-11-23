import { Router } from "express";
import { ObjectId } from "mongodb";

export const userRoutes = (users, verifyToken, verifyAdmin) => {
  const router = Router();

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
