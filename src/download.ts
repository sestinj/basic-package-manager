import fs from "fs";
import https from "https";
import path from "path";
import { saveToCache, tryCopyCacheTo } from "./globalCache";
import { nodeModulesPath } from "./paths";
import { Dep } from "./types";
const tar = require("tar");

export async function installPackagesInOrder(
  dependencies: Dep[]
): Promise<void> {
  for (const dep of dependencies) {
    await installSinglePackage(dep);
  }
}

export async function getPackageInfo(dep: Dep): Promise<any> {
  if (!dep.name || !dep.version) {
    throw new Error("Invalid dependency object");
  }
  const absoluteVersion = (
    dep.version.startsWith("^") ? dep.version.slice(1) : dep.version
  ).split(" ")[0];
  const resp = await fetch(
    `https://registry.npmjs.org/${dep.name}/${absoluteVersion}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );
  const data = await resp.json();
  return data;
}

async function downloadToNodeModules(dep: Dep, shasum: string): Promise<void> {
  // Try the global cache first
  const destPath = path.join(nodeModulesPath, dep.name);
  const foundInCache = await tryCopyCacheTo(shasum, destPath);
  if (foundInCache) {
    console.log(`Found ${dep.name}@${dep.version} in cache`);
    return;
  }

  const url = `https://registry.npmjs.org/${dep.name}/-/${dep.name}-${dep.version}.tgz`;
  const tarballPath = path.join(
    nodeModulesPath,
    `${dep.name.replace("@", "%40").replace("/", "%2F")}-${dep.version}.tgz`
  );

  await new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(tarballPath);

    https
      .get(url, (response) => {
        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close();
          resolve(null);
        });
      })
      .on("error", (error) => {
        fileStream.close();
        fs.unlink(tarballPath, () => {}); // Delete the file if an error occurs
        console.error(
          `Error downloading package ${dep.name}@${dep.version}:`,
          error
        );
        reject(error);
      });
  });

  // Extract the tarball
  try {
    await tar.extract({
      file: tarballPath,
      cwd: nodeModulesPath,
    });
  } catch (e) {
    console.error(`Error extracting package ${dep.name}@${dep.version}:`, e);
    return;
  } finally {
    // Delete the tarball
    fs.unlinkSync(tarballPath);
  }

  fs.renameSync(path.join(nodeModulesPath, "package"), destPath);

  // Save to cache
  saveToCache(shasum, destPath);
}

async function installSinglePackage(dep: Dep) {
  // Install from NPM
  console.log(`Installing ${dep.name}@${dep.version}...`);

  try {
    const data = await getPackageInfo(dep);
    await downloadToNodeModules(
      {
        ...dep,
        version: data.version,
      },
      data.dist.shasum
    );
  } catch (e) {
    console.error(`Error installing package ${dep.name}@${dep.version}:`, e);
    return;
  }
}
