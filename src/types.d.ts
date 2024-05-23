export interface DepGraph {
  dependencies: Record<string, string>;
  graph: {
    [key: string]: Record<string, string>;
  };
}
export interface Dep {
  name: string;
  version: string;
}
