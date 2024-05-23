import { Dep } from "./types";

export function depToStr(dep: Dep): string {
  return `${dep.name}@${dep.version}`;
}
