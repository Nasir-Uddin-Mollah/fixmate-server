import express from "express";
import cors from "cors";
import dotenv from "dotenv/config";
import { MongoClient } from "mongodb";
import { jwtVerify, createRemoteJWKSet } from "jose";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const connectedClient = await connectToMongoDB();
const db = connectedClient.db("fixmate");
const users = db.collection("users");
const services = db.collection("services");
const bookings = db.collection("bookings");
const payments = db.collection("payments");

// JWT verification middleware
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  let token = req.headers.authorization;

  if (token?.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }
  next();
};

const verifyCustomer = (req, res, next) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({
      message: "Customer access required",
    });
  }
  next();
};

const verifyTechnician = (req, res, next) => {
  if (req.user.role !== "technician") {
    return res.status(403).json({
      message: "Technician access required",
    });
  }
  next();
};

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
