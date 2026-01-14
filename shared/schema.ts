import { pgTable, text, serial, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const simulations = pgTable("simulations", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull(),
  score: integer("score"),
  feedback: jsonb("feedback"), // Structured feedback object
  createdAt: timestamp("created_at").defaultNow(),
});

export const transcripts = pgTable("transcripts", {
  id: serial("id").primaryKey(),
  simulationId: integer("simulation_id").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertSimulationSchema = createInsertSchema(simulations).omit({ 
  id: true, 
  createdAt: true,
  score: true,
  feedback: true 
});

export const insertTranscriptSchema = createInsertSchema(transcripts).omit({ 
  id: true, 
  timestamp: true 
});

export type Simulation = typeof simulations.$inferSelect;
export type InsertSimulation = z.infer<typeof insertSimulationSchema>;
export type Transcript = typeof transcripts.$inferSelect;
export type InsertTranscript = z.infer<typeof insertTranscriptSchema>;

// Detailed feedback structure stored in jsonb
export interface FeedbackSection {
  name: string;
  score: number; // 0-20 per section usually
  feedback: string;
}

export interface SimulationFeedback {
  totalScore: number;
  sections: FeedbackSection[];
  strengths: string[];
  improvements: string[];
}
