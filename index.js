import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Health check
app.get("/", (req, res) => {
  res.send("NexChat REALTIME backend is running");
});

// Realtime session
app.get("/api/realtime-session", async (req, res) => {
  try {
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview",
        modalities: ["audio", "text"],
        input_audio_format: "pcm16",   // 👈 IMPORTANT
        output_audio_format: "pcm16",  // 👈 IMPORTANT
        voice: "verse",
        turn_detection: { type: "server_vad" },
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("OpenAI Realtime error:", text);
      return res.status(r.status).json({ error: "Failed to create session", details: text });
    }

    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("Ephemeral session error:", err);
    res.status(500).json({ error: "Internal error creating realtime session" });
  }
});

app.listen(PORT, () => {
  console.log(`NexChat REALTIME backend listening on port ${PORT}`);
});
