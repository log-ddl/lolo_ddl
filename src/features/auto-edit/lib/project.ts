import type { SceneTracks, TimelineElement, TProject } from "../types";
import { allTracks } from "../types";
import { getScene } from "./mutate";

/** Every element in a scene, in render order (overlay bottom→top, main, audio). */
export function getSceneElements(tracks: SceneTracks): TimelineElement[] {
  const result: TimelineElement[] = [];
  for (const track of allTracks(tracks)) {
    for (const element of track.elements) result.push(element);
  }
  return result;
}

export function getElementEndTime(element: TimelineElement): number {
  return element.startTime + element.duration;
}

/** Duration of the project = the furthest element end time (with a floor). */
export function getProjectDurationMs(project: TProject, minMs = 0): number {
  const scene = getScene(project);
  let max = minMs;
  for (const element of getSceneElements(scene.tracks)) {
    max = Math.max(max, getElementEndTime(element));
  }
  return max;
}

/** The element's visible horizontal range in milliseconds. */
export function elementRange(element: TimelineElement): { start: number; end: number } {
  return { start: element.startTime, end: getElementEndTime(element) };
}
