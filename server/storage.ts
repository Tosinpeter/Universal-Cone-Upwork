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
import { eq, asc } from "drizzle-orm";

export interface IStorage {
  createSimulation(simulation: InsertSimulation): Promise<Simulation>;
  getSimulation(id: number): Promise<Simulation | undefined>;
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
