import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { generateAiResponse, generateScore } from "./openai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Create Simulation
  app.post(api.simulations.create.path, async (req, res) => {
    try {
      const input = api.simulations.create.input.parse(req.body);
      const simulation = await storage.createSimulation(input);
      
      // Initial greeting from AI
      const greeting = "Hello. I'm Dr. Hayes. I understand you wanted to talk about some of the new revision options. I'm pretty busy, so what have you got?";
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
    res.json(updatedSim);
  });

  return httpServer;
}
