import React from "react";
import { Box, Text } from "ink";
import { StatusBadge } from "./status-badge.js";
import { useElapsed } from "../hooks/use-elapsed.js";
import type { CloudAgent } from "../lib/types.js";

const BORDER = "#1e3a5f";
const LABEL = "#4a90c4";
const BODY = "#c9d1d9";
const DIM = "#4a6785";
const AMBER = "#e8912d";
const GREEN = "#3fb950";
const RED = "#f85149";

interface AgentRowProps {
  agent: CloudAgent;
  selected: boolean;
}

function repoShortName(repo: string): string {
  return repo
    .replace("https://github.com/", "")
    .replace("github.com/", "");
}

function AgentRow({ agent, selected }: AgentRowProps) {
  const elapsed = useElapsed(
    agent.status === "RUNNING" || agent.status === "CREATING"
      ? agent.createdAt
      : null,
  );

  const name =
    agent.name.length > 30 ? agent.name.slice(0, 30) + "…" : agent.name;

  const rightInfo = (() => {
    if (agent.status === "RUNNING" || agent.status === "CREATING") {
      return <Text color={DIM}>{elapsed}</Text>;
    }
    if (agent.status === "FINISHED" && agent.target.prUrl) {
      const prNum = agent.target.prUrl.match(/\/pull\/(\d+)/)?.[1];
      return <Text color={GREEN}>done → PR #{prNum ?? "?"}</Text>;
    }
    if (agent.status === "ERROR") {
      const msg = agent.summary?.slice(0, 30) ?? "error";
      return <Text color={RED}>error: {msg}</Text>;
    }
    if (agent.status === "EXPIRED") {
      return <Text color={DIM}>expired</Text>;
    }
    return <Text color={GREEN}>done</Text>;
  })();

  return (
    <Box>
      <Text color={selected ? AMBER : undefined}>
        {selected ? "▸" : " "}
      </Text>
      <StatusBadge status={agent.status} />
      <Text>{"  "}</Text>
      <Box width={32}>
        <Text color={BODY} wrap="truncate">
          {name}
        </Text>
      </Box>
      <Box width={22}>
        <Text color={DIM} wrap="truncate">
          {repoShortName(agent.source.repository)}
        </Text>
      </Box>
      <Box flexGrow={1}>{rightInfo}</Box>
    </Box>
  );
}

interface CloudAgentsTableProps {
  agents: CloudAgent[];
  selectedIndex: number;
}

export function CloudAgentsTable({
  agents,
  selectedIndex,
}: CloudAgentsTableProps) {
  if (agents.length === 0) return null;

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={BORDER}>
      <Box>
        <Text color={LABEL} bold>
          {" "}
          cloud{" "}
        </Text>
      </Box>
      {agents.map((agent, i) => (
        <AgentRow
          key={agent.id}
          agent={agent}
          selected={i === selectedIndex}
        />
      ))}
    </Box>
  );
}
