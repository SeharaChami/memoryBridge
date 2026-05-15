import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import statusRouter from "./routes/status.js";
import setupRouter from "./routes/setup.js";
import conversationRouter from "./routes/conversation.js";
import ttsRouter from "./routes/tts.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: false,
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api", statusRouter);
app.use("/api", setupRouter);
app.use("/api", conversationRouter);
app.use("/api", ttsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message =
    status === 500 ? "Internal server error" : err.message || "Request error";
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`MemoryBridge API listening on http://localhost:${PORT}`);
});
