import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { generateAiResponse, generateScore, generateTts } from "./openai";
import { sendSimulationReport } from "./resend";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // TTS endpoint
  app.post("/api/tts", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      const audioBuffer = await generateTts(text);
      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length,
      });
      res.send(audioBuffer);
    } catch (err) {
      console.error("TTS Error:", err);
      res.status(500).json({ message: "Failed to generate speech" });
    }
  });
  
  // Get All Simulations (Admin Dashboard)
  app.get("/api/simulations", async (req, res) => {
    const allSimulations = await storage.getAllSimulations();
    res.json(allSimulations);
  });

  // Get All Simulations with Transcripts (for export) - efficient bulk fetch
  app.get("/api/simulations/export", async (req, res) => {
    const exportData = await storage.getAllSimulationsWithTranscripts();
    res.json(exportData);
  });

  // Create Simulation
  app.post(api.simulations.create.path, async (req, res) => {
    try {
      const input = api.simulations.create.input.parse(req.body);
      const simulation = await storage.createSimulation(input);
      
      // Initial greeting from AI
      const greeting = "Hello. I'm Dr. Hayes. I understand you're here to talk about the TJO Universal Cone System. I'm currently using Stryker and I'm pretty happy with my results, but I've got a few minutes. What's so special about your system?";
      await storage.addTranscript({
        simulationId: simulation.id,
        role: 'assistant',
        content: greeting
      });

      res.status(201).json(simulation);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Get Simulation
  app.get(api.simulations.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const simulation = await storage.getSimulation(id);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }
    const transcripts = await storage.getTranscripts(id);
    res.json({ simulation, transcripts });
  });

  // Chat
  app.post(api.simulations.chat.path, async (req, res) => {
    const id = Number(req.params.id);
    const { message } = req.body;
    
    // Save user message
    await storage.addTranscript({
      simulationId: id,
      role: 'user',
      content: message
    });

    // Get history for context
    const history = await storage.getTranscripts(id);
    
    // Generate AI response
    const aiResponse = await generateAiResponse(history);
    
    // Save AI response
    await storage.addTranscript({
      simulationId: id,
      role: 'assistant',
      content: aiResponse
    });

    res.json({ message: aiResponse });
  });

  // Score
  app.post(api.simulations.score.path, async (req, res) => {
    const id = Number(req.params.id);
    const transcripts = await storage.getTranscripts(id);
    
    const { score, feedback } = await generateScore(transcripts);
    
    const updatedSim = await storage.updateSimulationScore(id, score, feedback);
    
    // Send email report asynchronously
    sendSimulationReport('semami@tjoinc.com', {
      name: updatedSim.userName,
      score: updatedSim.score || 0,
      feedback: updatedSim.feedback,
      transcript: transcripts
    }).catch(err => console.error('Background email report failed:', err));

    res.json(updatedSim);
  });

  return httpServer;
}
