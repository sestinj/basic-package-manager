import ncp from "ncp";
import fs from "node:fs";
import path from "node:path";
import { globalCachePath } from "./paths";

export async function tryCopyCacheTo(
  shasum: string,
  dest: string
): Promise<boolean> {
  // Create the cache directory if it doesn't exist
  if (!fs.existsSync(globalCachePath)) {
    fs.mkdirSync(globalCachePath, { recursive: true });
  }

  const src = path.join(globalCachePath, shasum);
  if (fs.existsSync(src) && fs.lstatSync(src).isDirectory()) {
    return new Promise((resolve, reject) => {
      ncp(src, dest, (err) => {
        if (err) {
          reject(false);
        } else {
          resolve(true);
        }
      });
    });
  }
  return false;
}

export async function saveToCache(shasum: string, src: string): Promise<void> {
  // Create the cache directory if it doesn't exist
  if (!fs.existsSync(globalCachePath)) {
    fs.mkdirSync(globalCachePath, { recursive: true });
  }

  const dest = path.join(globalCachePath, shasum);
  return new Promise((resolve, reject) => {
    ncp(src, dest, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
