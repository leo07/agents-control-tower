import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Select } from "@inkjs/ui";
import type { Repository, CreateAgentRequest } from "../lib/types.js";

const LABEL = "#4a90c4";
const BODY = "#c9d1d9";
const DIM = "#4a6785";
const AMBER = "#e8912d";
const GREEN = "#3fb950";

function repoDisplay(repo: Repository): string {
  return `${repo.owner}/${repo.name}`;
}

interface LaunchFlowProps {
  repos: Repository[];
  models: string[];
  reposLoading: boolean;
  modelsLoading: boolean;
  onLaunch: (params: CreateAgentRequest) => void;
  onCancel: () => void;
}

export function LaunchFlow({
  repos,
  models,
  reposLoading,
  modelsLoading,
  onLaunch,
  onCancel,
}: LaunchFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("default");
  const [filter, setFilter] = useState("");
  const [launched, setLaunched] = useState(false);

  useInput((_input, key) => {
    if (key.escape) {
      if (step === 1) onCancel();
      else setStep((s) => (s - 1) as 1 | 2 | 3);
    }
  });

  const filteredRepos = useMemo(() => {
    if (!filter) return repos;
    const lower = filter.toLowerCase();
    return repos.filter((r) =>
      repoDisplay(r).toLowerCase().includes(lower),
    );
  }, [repos, filter]);

  if (launched) {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={2}>
        <Text color={GREEN}>
          ✔ Agent launched: "{prompt.slice(0, 50)}..."
        </Text>
        <Text color={DIM}>
          {"   "}on {selectedRepo ? repoDisplay(selectedRepo) : ""} · model:{" "}
          {selectedModel}
        </Text>
        <Box marginTop={1}>
          <Text color={DIM}>Returning to dashboard...</Text>
        </Box>
      </Box>
    );
  }

  if (step === 1) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color={BODY} bold>
          AGENTS CONTROL TOWER
        </Text>
        <Box marginTop={1}>
          <Text color={LABEL}>NEW AGENT ─ step 1/3 ─ pick a repo</Text>
        </Box>
        <Box marginTop={1}>
          <Text color={DIM}>Filter: </Text>
          <TextInput placeholder="type to filter..." onChange={setFilter} />
        </Box>
        {reposLoading ? (
          <Box marginTop={1}>
            <Text color={DIM}>Loading repos...</Text>
          </Box>
        ) : (
          <Box marginTop={1}>
            <Select
              options={filteredRepos.map((r) => ({
                label: repoDisplay(r),
                value: r.repository,
              }))}
              onChange={(repoUrl) => {
                const repo = repos.find((r) => r.repository === repoUrl);
                if (repo) {
                  setSelectedRepo(repo);
                  setStep(2);
                }
              }}
            />
          </Box>
        )}
        <Box marginTop={1}>
          <Text color={DIM}>
            {filteredRepos.length} repos available · type to filter
          </Text>
        </Box>
        <Box marginTop={1} gap={2}>
          <Text color={AMBER}>↑↓</Text>
          <Text color={BODY}>navigate</Text>
          <Text color={AMBER}>enter</Text>
          <Text color={BODY}>select</Text>
          <Text color={AMBER}>esc</Text>
          <Text color={BODY}>cancel</Text>
        </Box>
      </Box>
    );
  }

  if (step === 2) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color={BODY} bold>
          AGENTS CONTROL TOWER
        </Text>
        <Box marginTop={1}>
          <Text color={LABEL}>NEW AGENT ─ step 2/3 ─ describe the task</Text>
        </Box>
        <Box marginTop={1}>
          <Text color={DIM}>
            Repo: {selectedRepo ? repoDisplay(selectedRepo) : ""}
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color={LABEL}>What should the agent do?</Text>
        </Box>
        <Box
          marginTop={1}
          borderStyle="single"
          borderColor={AMBER}
          paddingX={1}
          minHeight={5}
        >
          <TextInput
            placeholder="Describe the task..."
            onChange={setPrompt}
            onSubmit={() => {
              if (prompt.trim()) setStep(3);
            }}
          />
        </Box>
        <Box marginTop={1} gap={2}>
          <Text color={AMBER}>enter</Text>
          <Text color={BODY}>continue</Text>
          <Text color={AMBER}>esc</Text>
          <Text color={BODY}>back</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text color={BODY} bold>
        AGENTS CONTROL TOWER
      </Text>
      <Box marginTop={1}>
        <Text color={LABEL}>NEW AGENT ─ step 3/3 ─ configure</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text color={DIM}>
          Repo: {selectedRepo ? repoDisplay(selectedRepo) : ""}
        </Text>
        <Text color={DIM}>Task: {prompt.slice(0, 60)}...</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text color={LABEL}>Model:</Text>
        {modelsLoading ? (
          <Text color={DIM}>Loading models...</Text>
        ) : (
          <Select
            options={[
              { label: "default (auto)", value: "default" },
              ...models.map((m) => ({
                label: m,
                value: m,
              })),
            ]}
            onChange={setSelectedModel}
          />
        )}
      </Box>
      <Box marginTop={1} gap={2}>
        <Text color={AMBER}>enter</Text>
        <Text color={BODY}>launch</Text>
        <Text color={AMBER}>esc</Text>
        <Text color={BODY}>back</Text>
      </Box>

      {selectedModel && (
        <LaunchButton
          onLaunch={() => {
            setLaunched(true);
            onLaunch({
              prompt: { text: prompt },
              source: { repository: selectedRepo!.repository },
              model: selectedModel === "default" ? undefined : selectedModel,
              target: { autoCreatePr: true },
            });
          }}
        />
      )}
    </Box>
  );
}

function LaunchButton({ onLaunch }: { onLaunch: () => void }) {
  useInput((_input, key) => {
    if (key.return) onLaunch();
  });
  return null;
}
