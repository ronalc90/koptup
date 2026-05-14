export type NodeKind =
  | 'trigger'
  | 'filter'
  | 'http'
  | 'llm'
  | 'transform'
  | 'slack'
  | 'subflow';

export type NodeStatus = 'idle' | 'running' | 'success' | 'error';

export interface WorkflowNode {
  id: NodeKind;
  kind: NodeKind;
  x: number;
  y: number;
  status: NodeStatus;
}

export interface RunStep {
  nodeId: NodeKind;
  durationMs: number;
  status: 'success' | 'failed' | 'retry';
}

export interface RunRecord {
  id: string;
  startedAt: string;
  durationMs: number;
  status: 'success' | 'failed' | 'retry' | 'running';
  trigger: string;
  steps: RunStep[];
}
