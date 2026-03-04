export type AgentStatus =
  | "RUNNING"
  | "FINISHED"
  | "ERROR"
  | "CREATING"
  | "EXPIRED";

export interface AgentSource {
  repository: string;
  ref?: string;
}

export interface AgentTarget {
  branchName?: string;
  url: string;
  prUrl?: string;
  autoCreatePr?: boolean;
  autoBranch?: boolean;
  openAsCursorGithubApp?: boolean;
  skipReviewerRequest?: boolean;
}

export interface CloudAgent {
  id: string;
  name: string;
  status: AgentStatus;
  source: AgentSource;
  target: AgentTarget;
  summary?: string;
  createdAt: string;
}

export interface ConversationMessage {
  id: string;
  type: "user_message" | "assistant_message";
  text: string;
}

export interface AgentConversation {
  id: string;
  messages: ConversationMessage[];
}

export interface Artifact {
  absolutePath: string;
  sizeBytes: number;
  updatedAt: string;
}

export interface Repository {
  owner: string;
  name: string;
  repository: string;
}

export interface CreateAgentRequest {
  prompt: {
    text: string;
  };
  source: {
    repository: string;
    ref?: string;
  };
  model?: string;
  target?: {
    autoCreatePr?: boolean;
    branchName?: string;
  };
}

export interface FollowUpRequest {
  prompt: {
    text: string;
  };
}

export type Screen =
  | { type: "dashboard" }
  | { type: "detail"; agentId: string }
  | { type: "launch"; step: 1 | 2 | 3 }
  | { type: "follow-up"; agentId: string }
  | { type: "setup"; step: 1 | 2 }
  | { type: "error"; message: string; statusCode?: number };

export interface AppConfig {
  apiKey: string;
  hooksInstalled: boolean;
}

export interface AgentStats {
  running: number;
  completed: number;
  error: number;
  total: number;
}

export interface ActivityEvent {
  id: string;
  timestamp: Date;
  type: "started" | "completed" | "error" | "stopped";
  agentName: string;
  detail?: string;
}
