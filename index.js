// index.js
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Basic CORS so your website can call this API
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // later lock to your domain
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Simple health check
app.get("/", (req, res) => {
  res.send("NexChat REALTIME backend is running");
});

/**
 * GET /api/realtime-session
 *
 * Creates a short-lived OpenAI Realtime session (ephemeral client_secret).
 * Frontend uses this to open a WebSocket for live voice calls.
 */
app.get("/api/realtime-session", async (req, res) => {
  try {
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview", // or gpt-realtime if your account has it
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("OpenAI Realtime error:", text);
      return res.status(r.status).json({ error: "Failed to create session", details: text });
    }

    const data = await r.json();
    // data has { id, model, client_secret: { value, expires_at }, ... }
    res.json(data);
  } catch (err) {
    console.error("Ephemeral session error:", err);
    res.status(500).json({ error: "Internal error creating realtime session" });
  }
});

app.listen(PORT, () => {
  console.log(`NexChat REALTIME backend listening on port ${PORT}`);
});
