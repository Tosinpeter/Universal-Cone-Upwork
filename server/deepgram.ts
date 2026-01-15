import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { WebSocket as WsWebSocket, WebSocketServer } from "ws";
import type { Server } from "http";

export function setupDeepgramWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/deepgram" });

  wss.on("connection", (clientWs: WsWebSocket) => {
    console.log("Client connected to Deepgram WebSocket proxy");

    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      console.error("DEEPGRAM_API_KEY not found");
      clientWs.close(1008, "Deepgram API key not configured");
      return;
    }

    const deepgram = createClient(apiKey);
    
    const connection = deepgram.listen.live({
      model: "nova-2",
      language: "en-US",
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 1000,
      vad_events: true,
    });

    connection.on(LiveTranscriptionEvents.Open, () => {
      console.log("Deepgram connection opened");
      clientWs.send(JSON.stringify({ type: "connected" }));
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const transcript = data.channel?.alternatives[0]?.transcript;
      if (transcript) {
        clientWs.send(JSON.stringify({
          type: "transcript",
          text: transcript,
          isFinal: data.is_final,
        }));
      }
    });

    connection.on(LiveTranscriptionEvents.Error, (err) => {
      console.error("Deepgram error:", err);
      clientWs.send(JSON.stringify({ type: "error", message: err.message }));
    });

    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log("Deepgram connection closed");
    });

    clientWs.on("message", (data: Buffer) => {
      if (connection.getReadyState() === 1) {
        connection.send(data);
      }
    });

    clientWs.on("close", () => {
      console.log("Client disconnected from Deepgram proxy");
      connection.finish();
    });

    clientWs.on("error", (err) => {
      console.error("Client WebSocket error:", err);
      connection.finish();
    });
  });

  console.log("Deepgram WebSocket proxy initialized at /ws/deepgram");
}
