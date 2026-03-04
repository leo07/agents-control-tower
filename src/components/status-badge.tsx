import React, { useState, useEffect } from "react";
import { Text } from "ink";
import type { AgentStatus } from "../lib/types.js";

const AMBER = "#e8912d";
const GREEN = "#3fb950";
const RED = "#f85149";
const DIM = "#4a6785";

const STATUS_CONFIG: Record<
  AgentStatus,
  { symbol: string; color: string; pulse: boolean; label: string }
> = {
  RUNNING: { symbol: "◉", color: AMBER, pulse: true, label: "RUNNING" },
  CREATING: { symbol: "◉", color: AMBER, pulse: true, label: "CREATING" },
  FINISHED: { symbol: "✔", color: GREEN, pulse: false, label: "FINISHED" },
  ERROR: { symbol: "✖", color: RED, pulse: false, label: "ERROR" },
  EXPIRED: { symbol: "◉", color: DIM, pulse: false, label: "EXPIRED" },
};

interface StatusBadgeProps {
  status: AgentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const [bright, setBright] = useState(true);

  useEffect(() => {
    if (!config.pulse) return;
    const timer = setInterval(() => setBright((b) => !b), 1000);
    return () => clearInterval(timer);
  }, [config.pulse]);

  return (
    <Text color={config.color} dimColor={config.pulse && !bright}>
      {config.symbol}
    </Text>
  );
}

export function StatusLabel({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return <Text color={config.color}>{config.label}</Text>;
}
