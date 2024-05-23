import { DepGraph } from "./types";

export function topologicalSort(graph: DepGraph): string[] {
  const visited: Set<string> = new Set();
  const stack: string[] = [];

  function dfs(node: string): void {
    visited.add(node);
    const neighbors = graph.graph[node];
    if (neighbors) {
      for (const neighborName of Object.keys(neighbors)) {
        if (!visited.has(neighborName)) {
          dfs(neighborName);
        }
      }
    }
    stack.push(node);
  }

  for (const node of Object.keys(graph.graph)) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return stack.reverse();
}
