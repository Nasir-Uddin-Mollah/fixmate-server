import { Router } from "express";
import { ObjectId } from "mongodb";

export const serviceRoutes = (
  services,
  verifyToken,
  verifyTechnician,
  verifyAdmin,
) => {
  const router = Router();

  router.post("/", verifyToken, verifyTechnician, async (req, res) => {
    const service = {
      ...req.body,
      technicianName: req.user.name,
      technicianEmail: req.user.email,
      approvalStatus: "pending",
      isAvailable: true,
      createdAt: new Date(),
    };

    try {
      const result = await services.insertOne(service);
      res.status(201).send({ ...service, _id: result.insertedId });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Could not save service" });
    }
  });

  router.get("/my", verifyToken, verifyTechnician, async (req, res) => {
    try {
      const myServices = await services
        .find({ technicianEmail: req.user.email })
        .sort({ createdAt: -1 })
        .toArray();
      res.send(myServices);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Could not fetch services" });
    }
  });

  router.get("/admin/all", verifyToken, verifyAdmin, async (req, res) => {
    try {
      const all = await services.find().sort({ createdAt: -1 }).toArray();

      const pending = all.filter((s) => s.approvalStatus === "pending");
      const others = all.filter((s) => s.approvalStatus !== "pending");

      res.send([...pending, ...others]);
    } catch {
      res.status(500).send({ message: "Could not fetch submissions" });
    }
  });

  router.patch("/:id/approval", verifyToken, verifyAdmin, async (req, res) => {
    try {
      const status = req.body.approvalStatus;
      if (status !== "approved" && status !== "rejected") {
        return res.status(400).send({ message: "Invalid approval status" });
      }

      const updated = await services.findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            approvalStatus: status,
            isAvailable: status === "approved",
          },
        },
        { returnDocument: "after" },
      );

      if (!updated) {
        return res.status(404).send({ message: "Service not found" });
      }

      res.send(updated);
    } catch {
      res.status(400).send({ message: "Invalid service id" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const service = await services.findOne({
        _id: new ObjectId(req.params.id),
        approvalStatus: "approved",
        isAvailable: true,
      });

      if (!service) {
        return res.status(404).send({ message: "Service not found" });
      }
      res.send(service);
    } catch {
      res.status(400).send({ message: "Invalid service id" });
    }
  });

  router.get("/", async (req, res) => {
    const filter = { approvalStatus: "approved", isAvailable: true };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.serviceMode) filter.serviceMode = req.query.serviceMode;

    if (req.query.q) {
      const text = String(req.query.q).trim();
      const safe = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: safe, $options: "i" };
    }

    let sortOption = { createdAt: -1 };
    if (req.query.sort === "price_asc") sortOption = { basePrice: 1 };
    if (req.query.sort === "price_desc") sortOption = { basePrice: -1 };
    if (req.query.sort === "title") sortOption = { title: 1 };

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    try {
      const items = await services
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await services.countDocuments(filter);

      res.send({
        services: items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Could not fetch services" });
    }
  });

  return router;
};
