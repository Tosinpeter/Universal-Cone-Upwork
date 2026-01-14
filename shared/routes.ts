import { z } from 'zod';
import { insertSimulationSchema, insertTranscriptSchema, simulations, transcripts } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  simulations: {
    create: {
      method: 'POST' as const,
      path: '/api/simulations',
      input: insertSimulationSchema,
      responses: {
        201: z.custom<typeof simulations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/simulations/:id',
      responses: {
        200: z.object({
          simulation: z.custom<typeof simulations.$inferSelect>(),
          transcripts: z.array(z.custom<typeof transcripts.$inferSelect>()),
        }),
        404: errorSchemas.notFound,
      },
    },
    chat: {
      method: 'POST' as const,
      path: '/api/simulations/:id/chat',
      input: z.object({
        message: z.string(),
      }),
      responses: {
        200: z.object({
          message: z.string(), // AI response
        }),
        404: errorSchemas.notFound,
      },
    },
    score: {
      method: 'POST' as const,
      path: '/api/simulations/:id/score',
      responses: {
        200: z.custom<typeof simulations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
