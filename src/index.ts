import { program } from "commander";
import fs from "fs";
import { installPackagesInOrder } from "./download";
import { buildDepGraph } from "./install";
import { nodeModulesPath, packageJsonPath, packageLockJsonPath } from "./paths";
import { topologicalSort } from "./topoSort";

const DEFAULT_PACKAGE_JSON = {
  name: "my-package",
  version: "1.0.0",
  description: "",
  main: "index.js",
  scripts: {
    test: 'echo "Error: no test specified" && exit 1',
  },
  keywords: [],
  author: "",
  license: "ISC",
  dependencies: {},
};

program
  .command("add <package>")
  .description("Add a package")
  .action((item) => {
    const [packageName, version] = item.split("@");

    console.log(`Adding package: ${item}...`);
    if (!fs.existsSync(packageJsonPath)) {
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(DEFAULT_PACKAGE_JSON, null, 2)
      );
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packageJson.dependencies[packageName] = version || "latest";
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Done!`);
  });

program
  .command("install")
  .description("Install dependencies")
  .action(async () => {
    console.log("Installing dependencies...");
    // Delete the node_modules folder if it exists
    if (fs.existsSync(nodeModulesPath)) {
      fs.rmSync(nodeModulesPath, { recursive: true });
    }
    fs.mkdirSync(nodeModulesPath);

    const dependencies = JSON.parse(
      fs.readFileSync(packageJsonPath, "utf8")
    ).dependencies;
    let depGraph = await buildDepGraph(dependencies);

    if (fs.existsSync(packageLockJsonPath)) {
      depGraph = JSON.parse(fs.readFileSync(packageLockJsonPath, "utf8"));
    }

    console.log("\n\nDependency graph built\n\n");
    console.log(depGraph);
    const allDeps = topologicalSort(depGraph);
    console.log("\n\nTopological sort\n\n");
    console.log(allDeps);

    await installPackagesInOrder(
      allDeps.map((name) => ({ name, version: depGraph.dependencies[name] }))
    );

    if (!fs.existsSync(packageLockJsonPath)) {
      fs.writeFileSync(packageLockJsonPath, JSON.stringify(depGraph, null, 2));
    }
  });

program.parse(process.argv);
