import { useState, useEffect, useCallback, useRef } from "react";
import {
  listAgents,
  stopAgent,
  deleteAgent,
  createAgent,
  followUpAgent,
  CursorApiError,
} from "../lib/cursor-api.js";
import type {
  CloudAgent,
  AgentStats,
  ActivityEvent,
  CreateAgentRequest,
} from "../lib/types.js";

const POLL_INTERVAL = 5000;

interface UseCloudAgentsResult {
  agents: CloudAgent[];
  stats: AgentStats;
  activity: ActivityEvent[];
  lastSync: Date | null;
  error: CursorApiError | null;
  loading: boolean;
  refresh: () => Promise<void>;
  launch: (params: CreateAgentRequest) => Promise<CloudAgent>;
  followUp: (agentId: string, text: string) => Promise<void>;
  stop: (agentId: string) => Promise<void>;
  remove: (agentId: string) => Promise<void>;
}

function computeStats(agents: CloudAgent[]): AgentStats {
  return {
    running: agents.filter(
      (a) => a.status === "RUNNING" || a.status === "CREATING",
    ).length,
    completed: agents.filter((a) => a.status === "FINISHED").length,
    error: agents.filter((a) => a.status === "ERROR").length,
    total: agents.length,
  };
}

function diffActivity(
  prev: CloudAgent[],
  next: CloudAgent[],
): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const prevMap = new Map(prev.map((a) => [a.id, a]));

  for (const agent of next) {
    const old = prevMap.get(agent.id);
    if (!old) {
      events.push({
        id: `${agent.id}-started`,
        timestamp: new Date(),
        type: "started",
        agentName: agent.name,
        detail: agent.source.repository,
      });
    } else if (old.status !== agent.status) {
      const type =
        agent.status === "FINISHED"
          ? "completed"
          : agent.status === "ERROR"
            ? "error"
            : agent.status === "EXPIRED"
              ? "stopped"
              : "started";
      events.push({
        id: `${agent.id}-${type}-${Date.now()}`,
        timestamp: new Date(),
        type,
        agentName: agent.name,
        detail:
          agent.status === "FINISHED" && agent.target.prUrl
            ? `PR ${agent.target.prUrl}`
            : agent.summary ?? undefined,
      });
    }
  }

  return events;
}

export function useCloudAgents(apiKey: string): UseCloudAgentsResult {
  const [agents, setAgents] = useState<CloudAgent[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<CursorApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const prevAgentsRef = useRef<CloudAgent[]>([]);

  const refresh = useCallback(async () => {
    try {
      const data = await listAgents(apiKey);
      const newEvents = diffActivity(prevAgentsRef.current, data);
      if (newEvents.length > 0) {
        setActivity((prev) => [...newEvents, ...prev].slice(0, 50));
      }
      prevAgentsRef.current = data;
      setAgents(data);
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      if (err instanceof CursorApiError) {
        setError(err);
      } else {
        setError(new CursorApiError(0, String(err)));
      }
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  const launch = useCallback(
    async (params: CreateAgentRequest) => {
      const agent = await createAgent(apiKey, params);
      await refresh();
      return agent;
    },
    [apiKey, refresh],
  );

  const followUp = useCallback(
    async (agentId: string, text: string) => {
      await followUpAgent(apiKey, agentId, { prompt: { text } });
      await refresh();
    },
    [apiKey, refresh],
  );

  const stop = useCallback(
    async (agentId: string) => {
      await stopAgent(apiKey, agentId);
      await refresh();
    },
    [apiKey, refresh],
  );

  const remove = useCallback(
    async (agentId: string) => {
      await deleteAgent(apiKey, agentId);
      await refresh();
    },
    [apiKey, refresh],
  );

  return {
    agents,
    stats: computeStats(agents),
    activity,
    lastSync,
    error,
    loading,
    refresh,
    launch,
    followUp,
    stop,
    remove,
  };
}
