export type CompareRequest = {
  query: string;
  preference?: string;
};

export type CompareCell = {
  text: string;
  source?: string;
};

export type CompareResult = {
  products: string[];
  columns: string[];
  cells: Record<string, Record<string, CompareCell>>;
  wins?: Record<string, string>;
  pick: { name: string; reason: string };
  caveat: string;
};

export type AgentEvent =
  | { type: 'status'; text: string }
  | { type: 'tool'; name: string; input: string }
  | { type: 'result'; data: CompareResult }
  | { type: 'error'; message: string };
