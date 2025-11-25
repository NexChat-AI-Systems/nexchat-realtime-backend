// index.js
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Basic CORS so your website can call this API
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // you can later lock this to your domain
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Health check
app.get("/", (req, res) => {
  res.send("NexChat voice demo backend is running");
});

// Voice-chat endpoint: text in → text out
app.post("/api/chat", async (req, res) => {
  const userMessage = (req.body && req.body.message) || "";

  if (!userMessage.trim()) {
    return res.status(400).json({ error: "Missing message text." });
  }

  try {
    // Call OpenAI Chat API (Node 18+ has global fetch)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are NexChat, a friendly 24/7 phone receptionist for small trade businesses like plumbers, electricians, roofers and HVAC companies. " +
              "Speak as if you're on a phone call. Be short, clear and helpful. Ask simple follow-up questions to book jobs.",
          },
          { role: "user", content: userMessage },
        ],
      }),
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I didn't catch that. Can you say it again?";

    return res.json({ reply });
  } catch (err) {
    console.error("OpenAI error:", err);
    return res
      .status(500)
      .json({ error: "Something went wrong talking to NexChat." });
  }
});

app.listen(PORT, () => {
  console.log(`NexChat backend listening on port ${PORT}`);
});
