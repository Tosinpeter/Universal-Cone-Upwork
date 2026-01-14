import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertSimulation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// ============================================
// HOOKS
// ============================================

// POST /api/simulations
export function useCreateSimulation() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  return useMutation({
    mutationFn: async (data: InsertSimulation) => {
      const res = await fetch(api.simulations.create.path, {
        method: api.simulations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create simulation");
      }
      
      return api.simulations.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      setLocation(`/simulation/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// GET /api/simulations/:id
export function useSimulation(id: number) {
  return useQuery({
    queryKey: [api.simulations.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.simulations.get.path, { id });
      const res = await fetch(url);
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch simulation");
      
      return api.simulations.get.responses[200].parse(await res.json());
    },
    enabled: !!id && !isNaN(id),
  });
}

// POST /api/simulations/:id/chat
export function useChat(id: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (message: string) => {
      const url = buildUrl(api.simulations.chat.path, { id });
      const res = await fetch(url, {
        method: api.simulations.chat.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      
      if (!res.ok) throw new Error("Failed to send message");
      
      return api.simulations.chat.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate the simulation query to refresh the transcript list
      queryClient.invalidateQueries({ queryKey: [api.simulations.get.path, id] });
    },
  });
}

// POST /api/simulations/:id/score
export function useScoreSimulation(id: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async () => {
      const url = buildUrl(api.simulations.score.path, { id });
      const res = await fetch(url, {
        method: api.simulations.score.method,
      });
      
      if (!res.ok) throw new Error("Failed to score simulation");
      
      return api.simulations.score.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.simulations.get.path, id] });
      setLocation(`/simulation/${id}/results`);
    },
    onError: () => {
      toast({
        title: "Scoring Failed",
        description: "Could not generate feedback at this time.",
        variant: "destructive",
      });
    },
  });
}
