const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;

// Simple health check route
app.get("/", (req, res) => {
  res.send("NexChat realtime backend is running");
});

const server = http.createServer(app);

// WebSocket server on /realtime
const wss = new WebSocket.Server({ server, path: "/realtime" });

wss.on("connection", (clientSocket) => {
  console.log("Client connected to NexChat backend");

  // Connect to OpenAI Realtime API
  const openaiSocket = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    }
  );

  // When connection to OpenAI opens, send our NexChat instructions
  openaiSocket.on("open", () => {
    console.log("Connected to OpenAI Realtime API");

    const sessionUpdate = {
      type: "session.update",
      session: {
        instructions:
          "You are NexChat, a friendly 24/7 automated phone receptionist for plumbers and other trade businesses. This is a demo call. Greet the caller, ask for their name, their plumbing issue, their location, how urgent it is, and their preferred time. Keep responses short (one or two sentences). Do NOT give emergency instructions. If they mention danger, tell them to contact emergency services. End the demo by saying: 'This was a demonstration of NexChat. In the real system, we automatically book jobs and send all details to the business owner.' Keep the whole call under 60 to 90 seconds."
      }
    };

    openaiSocket.send(JSON.stringify(sessionUpdate));
  });

  // Relay messages from browser → OpenAI
  clientSocket.on("message", (message) => {
    if (openaiSocket.readyState === WebSocket.OPEN) {
      openaiSocket.send(message);
    }
  });

  // Relay messages from OpenAI → browser
  openaiSocket.on("message", (message) => {
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(message);
    }
  });

  // Cleanup on close
  clientSocket.on("close", () => {
    console.log("Client disconnected");
    if (openaiSocket.readyState === WebSocket.OPEN) {
      openaiSocket.close();
    }
  });

  openaiSocket.on("close", () => {
    console.log("OpenAI connection closed");
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.close();
    }
  });

  clientSocket.on("error", (err) =>
    console.error("Client socket error:", err)
  );
  openaiSocket.on("error", (err) =>
    console.error("OpenAI socket error:", err)
  );
});

server.listen(PORT, () => {
  console.log(`NexChat realtime backend listening on port ${PORT}`);
});
