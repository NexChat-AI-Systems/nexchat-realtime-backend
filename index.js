import express from "express";
import { WebSocketServer } from "ws";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 8080;

// Root Route
app.get("/", (req, res) => {
  res.send("NexChat Realtime Backend is running");
});

// Start HTTP server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// WebSocket Server
const wss = new WebSocketServer({ server });

wss.on("connection", async (ws) => {
  console.log("Client connected");

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openaiWS = await client.realtime.connect({
    model: "gpt-4o-realtime-preview",
  });

  const duplex = WebSocketServer.createWebSocketStream(ws, {
    encoding: "utf8",
  });

  const openaiDuplex = WebSocketServer.createWebSocketStream(openaiWS, {
    encoding: "utf8",
  });

  duplex.pipe(openaiDuplex).pipe(duplex);

  ws.on("close", () => {
    console.log("Client disconnected");
    openaiWS.close();
  });
});

