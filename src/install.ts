import { getPackageInfo } from "./download";
import { DepGraph } from "./types";

export async function buildDepGraph(
  dependencies: Record<string, string>
): Promise<DepGraph> {
  const depGraph: DepGraph = {
    dependencies: {},
    graph: {},
  };
  const queue = [
    ...Object.entries(dependencies).map(([name, version]) => ({
      name,
      version,
    })),
  ];

  while (queue.length > 0) {
    const { name, version } = queue.shift()!;
    console.log(`Processing ${name}@${version} (${queue.length} left)`);
    const depInfo = await getPackageInfo({ name, version });

    const versionAlreadyRequired = depGraph.dependencies[depInfo.name];
    if (versionAlreadyRequired) {
      if (versionAlreadyRequired !== depInfo.version) {
        console.warn(
          `Conflict detected: ${depInfo.name}@${versionAlreadyRequired} and ${depInfo.name}@${depInfo.version}`
        );
      }

      // Skip if already processed
      continue;
    }

    if (depInfo.name === undefined) {
      console.warn(`Dependency ${name}@${version} not found`);
      continue;
    }
    depGraph.graph[depInfo.name] = depInfo.dependencies ?? {};
    depGraph.dependencies[depInfo.name] = depInfo.version;

    for (const [depName, depVersion] of Object.entries(
      depInfo.dependencies ?? {}
    )) {
      queue.push({ name: depName, version: depVersion as string });
    }
  }

  return depGraph;
}
