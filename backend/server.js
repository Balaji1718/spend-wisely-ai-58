require("dotenv").config();
const express = require("express");
const cors = require("cors");
const analyticsRouter = require("./routes/analytics");
const chatRouter = require("./routes/chat");
const parseRouter = require("./routes/parse");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:8080" }));
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api", analyticsRouter);
app.use("/api", chatRouter);
app.use("/api", parseRouter);

app.listen(PORT, () => console.log(`SpendPilot backend running on port ${PORT}`));
