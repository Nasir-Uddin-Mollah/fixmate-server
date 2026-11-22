import { Router } from "express";

export const serviceRoutes = (services, verifyToken, verifyTechnician) => {
  const router = Router();

  router.post("/", verifyToken, verifyTechnician, async (req, res) => {
    try {
      const data = req.body;
      const service = {
        ...data,
        technicianName: req.user.name,
        technicianEmail: req.user.email,
        approvalStatus: "pending",
        isAvailable: true,
        createdAt: new Date(),
      };

      const result = await services.insertOne(service);
      return res.status(201).send({ ...service, _id: result.insertedId });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Could not save service" });
    }
  });

  router.get("/", verifyToken, verifyTechnician, async (req, res) => {
    try {
      const myServices = await services
        .find({ technicianEmail: req.user.email })
        .sort({ createdAt: -1 })
        .toArray();
      return res.send(myServices);
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Could not fetch services" });
    }
  });

  return router;
};
