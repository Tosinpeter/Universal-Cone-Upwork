import { db } from "./db";
import {
  simulations,
  transcripts,
  type InsertSimulation,
  type InsertTranscript,
  type Simulation,
  type Transcript,
  type SimulationFeedback
} from "@shared/schema";
import { eq, asc, desc, isNotNull } from "drizzle-orm";

export interface IStorage {
  createSimulation(simulation: InsertSimulation): Promise<Simulation>;
  getSimulation(id: number): Promise<Simulation | undefined>;
  getAllSimulations(): Promise<Simulation[]>;
  getAllSimulationsWithTranscripts(): Promise<(Simulation & { transcripts: Transcript[] })[]>;
  getTop10Simulations(): Promise<Simulation[]>;
  addTranscript(transcript: InsertTranscript): Promise<Transcript>;
  getTranscripts(simulationId: number): Promise<Transcript[]>;
  updateSimulationScore(id: number, score: number, feedback: SimulationFeedback): Promise<Simulation>;
}

export class DatabaseStorage implements IStorage {
  async createSimulation(simulation: InsertSimulation): Promise<Simulation> {
    const [newSim] = await db.insert(simulations).values(simulation).returning();
    return newSim;
  }

  async getSimulation(id: number): Promise<Simulation | undefined> {
    const [sim] = await db.select().from(simulations).where(eq(simulations.id, id));
    return sim;
  }

  async getAllSimulations(): Promise<Simulation[]> {
    return await db.select().from(simulations).orderBy(desc(simulations.createdAt));
  }

  async getAllSimulationsWithTranscripts(): Promise<(Simulation & { transcripts: Transcript[] })[]> {
    // Fetch all in two efficient queries instead of N+1
    const allSims = await db.select().from(simulations).orderBy(desc(simulations.createdAt));
    const allTranscripts = await db.select().from(transcripts).orderBy(asc(transcripts.timestamp));
    
    // Group transcripts by simulationId
    const transcriptsBySimId = new Map<number, Transcript[]>();
    for (const t of allTranscripts) {
      const existing = transcriptsBySimId.get(t.simulationId) || [];
      existing.push(t);
      transcriptsBySimId.set(t.simulationId, existing);
    }
    
    return allSims.map(sim => ({
      ...sim,
      transcripts: transcriptsBySimId.get(sim.id) || []
    }));
  }

  async getTop10Simulations(): Promise<Simulation[]> {
    // Get top 10 completed simulations with highest scores
    return await db.select()
      .from(simulations)
      .where(isNotNull(simulations.score))
      .orderBy(desc(simulations.score))
      .limit(10);
  }

  async addTranscript(transcript: InsertTranscript): Promise<Transcript> {
    const [entry] = await db.insert(transcripts).values(transcript).returning();
    return entry;
  }

  async getTranscripts(simulationId: number): Promise<Transcript[]> {
    return await db.select()
      .from(transcripts)
      .where(eq(transcripts.simulationId, simulationId))
      .orderBy(asc(transcripts.timestamp));
  }

  async updateSimulationScore(id: number, score: number, feedback: SimulationFeedback): Promise<Simulation> {
    const [updated] = await db.update(simulations)
      .set({ score, feedback })
      .where(eq(simulations.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
