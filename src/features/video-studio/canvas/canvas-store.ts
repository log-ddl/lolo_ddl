import { remapMentions, mentionPattern } from './mentions';
/**
 * Canvas state: a list of spaces, each holding its own node graph.
 *
 * Global on purpose — a space is not owned by a Video Studio project, so
 * switching projects never hides a canvas. The space id is what identifies the
 * work downstream at Flow.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { replayEdit, type CanvasEdit } from './history';
import { canConnect, descendants } from './graph';
import {
  CANVAS_AUTO_MODEL,
  nodeSpec,
  type CanvasEdgeState,
  type CanvasNodeKind,
  type CanvasNodeState,
  type CanvasSpace,
  type NodeOutput,
} from './types';

const DEFAULT_ASPECT_RATIO = '1:1';

interface CanvasStore {
  templates: { id: string; name: string; nodes: CanvasNodeState[]; edges: CanvasEdgeState[] }[];
  saveTemplate: (spaceId: string, selected: string[], name: string) => void;
  deleteTemplate: (id: string) => void;
  spaces: CanvasSpace[];
  undoStacks: Record<string, CanvasEdit[]>;
  redoStacks: Record<string, CanvasEdit[]>;
  undo: (spaceId: string) => void;
  redo: (spaceId: string) => void;
  setViewport: (spaceId: string, viewport: NonNullable<CanvasSpace['viewport']>) => void;
  replaceGraph: (spaceId: string, nodes: CanvasNodeState[], edges: CanvasEdgeState[]) => void;
  importSpace: (space: CanvasSpace) => string;
  groupNodes: (spaceId: string, ids: string[], name: string) => void;
  ungroupNodes: (spaceId: string, ids: string[]) => void;
  moveNodes: (spaceId: string, moves: { id: string; position: { x: number; y: number } }[]) => void;
  removeElements: (spaceId: string, nodeIds: string[], edgeIds: string[]) => void;
  selectOutput: (spaceId: string, nodeId: string, output: NodeOutput) => void;
  activeSpaceId: string | null;

  createSpace: (name?: string) => string;
  renameSpace: (spaceId: string, name: string) => void;
  deleteSpace: (spaceId: string) => void;
  openSpace: (spaceId: string | null) => void;

  addNode: (spaceId: string, kind: CanvasNodeKind, position: { x: number; y: number }) => string;
  setLocalImage: (spaceId: string, nodeId: string, url: string) => void;
  pasteNodes: (spaceId: string, nodes: CanvasNodeState[], edges: CanvasEdgeState[], offset: number) => string[];
  duplicateNode: (spaceId: string, nodeId: string) => string | null;
  updateNode: (spaceId: string, nodeId: string, patch: Partial<CanvasNodeState>) => void;
  addRefs: (spaceId: string, nodeId: string, paths: string[]) => void;
  removeRef: (spaceId: string, nodeId: string, path: string) => void;
  moveNode: (spaceId: string, nodeId: string, position: { x: number; y: number }) => void;
  removeNode: (spaceId: string, nodeId: string) => void;

  connect: (spaceId: string, connection: { source: string; target: string; targetHandle?: string | null }) => void;
  disconnect: (spaceId: string, edgeId: string) => void;
}

function touch(space: CanvasSpace, patch: Partial<CanvasSpace>): CanvasSpace {
  return { ...space, ...patch, updatedAt: Date.now() };
}

/**
 * Editing a node invalidates everything fed from it. Applied to the node itself
 * only when it has already produced something — an untouched node is not stale,
 * it is empty, and the two read very differently in the UI.
 */
function spreadStale(space: CanvasSpace, nodeId: string): CanvasNodeState[] {
  const affected = new Set([nodeId, ...descendants(space.edges, nodeId)]);
  return space.nodes.map((node) =>
    affected.has(node.id) && (node.output || node.textOutput) ? { ...node, stale: true } : node,
  );
}

/** Per-kind display numbering that never reuses a number within a space. */
function nextIndex(space: CanvasSpace, kind: CanvasNodeKind): number {
  const used = space.nodes.filter((node) => node.kind === kind).map((node) => node.index);
  return used.length > 0 ? Math.max(...used) + 1 : 1;
}

/** Roughly a node's footprint, used only to keep new nodes from piling up. */
const NODE_WIDTH = 280;
const NODE_STAGGER = 64;

/**
 * Nudge a new node off any node already sitting there. Adding from the toolbar
 * always asks for the same spot, and a node dropped near enough to another to
 * cover it looks like nothing happened at all. The threshold is a node's own
 * size rather than a few pixels — two nodes 50px apart still read as one pile.
 */
function freePosition(space: CanvasSpace, desired: { x: number; y: number }) {
  const taken = (point: { x: number; y: number }) =>
    space.nodes.some((node) =>
      Math.abs(node.position.x - point.x) < NODE_WIDTH * 0.6 && Math.abs(node.position.y - point.y) < 140);
  const position = { ...desired };
  // Bounded: past a screen's worth of offsets the canvas is crowded enough that
  // one more overlap is not what the user is struggling with.
  for (let step = 0; step < 20 && taken(position); step += 1) {
    position.x += NODE_STAGGER;
    position.y += NODE_STAGGER;
  }
  return position;
}

function sizeGroups(nodes: CanvasNodeState[]): CanvasNodeState[] {
  return nodes.map((node) => {
    if (node.kind !== 'group') return node;
    const members = nodes.filter((child) => child.groupId === node.id);
    if (!members.length) return node;
    const x = Math.min(...members.map((child) => child.position.x)) - 28;
    const y = Math.min(...members.map((child) => child.position.y)) - 55;
    return { ...node, position: { x, y }, width: Math.max(...members.map((child) => child.position.x + (child.kind.startsWith('local') ? 220 : child.kind === 'text' || child.kind === 'note' ? 240 : 280))) - x + 28,
      height: Math.max(...members.map((child) => child.position.y + (child.kind.startsWith('local') ? 186 : child.kind === 'text' || child.kind === 'note' ? 150 : 320))) - y + 28 };
  });
}

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => {
      /** Apply `mutate` to one space and stamp its updatedAt, or do nothing. */
      const withSpace = (spaceId: string, mutate: (space: CanvasSpace) => Partial<CanvasSpace>, record = true) => {
        set((state) => {
          const before = state.spaces.find((space) => space.id === spaceId);
          if (!before) return state;
          const patch = mutate(before);
          if (Object.keys(patch).every((key) => JSON.stringify(before[key as keyof CanvasSpace]) === JSON.stringify(patch[key as keyof CanvasSpace]))) return state;
          const after = touch(before, patch);
          after.nodes = sizeGroups(after.nodes);
          return {
            spaces: state.spaces.map((space) => space.id === spaceId ? after : space),
            ...(record ? {
              undoStacks: { ...state.undoStacks, [spaceId]: [...(state.undoStacks[spaceId] || []), { before, after }].slice(-50) },
              redoStacks: { ...state.redoStacks, [spaceId]: [] },
            } : {}),
          };
        });
      };
      const travel = (spaceId: string, undo: boolean) => {
        set((state) => {
          const space = state.spaces.find((candidate) => candidate.id === spaceId);
          const source = undo ? state.undoStacks : state.redoStacks;
          const destination = undo ? state.redoStacks : state.undoStacks;
          const stack = source[spaceId] || [];
          const edit = stack[stack.length - 1];
          if (!space || !edit || space.nodes.some((node) => node.status === 'running')) return state;
          // When undo removes a newly added node, keep media generated since the
          // original edit so redo can restore it as well.
          const removedSide = undo ? edit.after : edit.before;
          const retainedSide = undo ? edit.before : edit.after;
          const refreshed = { ...removedSide, nodes: removedSide.nodes.map((node) =>
            retainedSide.nodes.some((candidate) => candidate.id === node.id) ? node
              : space.nodes.find((candidate) => candidate.id === node.id) || node) };
          const savedEdit = { ...edit, [undo ? 'after' : 'before']: refreshed };
          return {
            spaces: state.spaces.map((candidate) => candidate.id === spaceId ? replayEdit(space, edit, undo) : candidate),
            [undo ? 'undoStacks' : 'redoStacks']: { ...source, [spaceId]: stack.slice(0, -1) },
            [undo ? 'redoStacks' : 'undoStacks']: { ...destination, [spaceId]: [...(destination[spaceId] || []), savedEdit] },
          };
        });
      };

      return {
        templates: [],
        saveTemplate: (spaceId, selected, name) => {
          const space = get().spaces.find((space) => space.id === spaceId);
          if (!space || !name.trim()) return;
          const ids = new Set(selected);
          for (const node of space.nodes) if (node.groupId && ids.has(node.groupId)) ids.add(node.id);
          const nodes = structuredClone(space.nodes.filter((node) => ids.has(node.id)));
          if (!nodes.length) return;
          set((state) => ({ templates: [...state.templates, { id: nanoid(), name: name.trim(), nodes, edges: structuredClone(space.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target))) }] }));
        },
        deleteTemplate: (id) => set((state) => ({ templates: state.templates.filter((template) => template.id !== id) })),
        spaces: [],
        undoStacks: {},
        redoStacks: {},
        undo: (spaceId) => travel(spaceId, true),
        redo: (spaceId) => travel(spaceId, false),
        setViewport: (spaceId, viewport) => withSpace(spaceId, () => ({ viewport }), false),
        replaceGraph: (spaceId, nodes, edges) => withSpace(spaceId, () => ({ nodes, edges })),
        importSpace: (space) => {
          const id = `space_${nanoid(10)}`;
          const ids = new Map(space.nodes.map((node) => [node.id, `node_${nanoid(10)}`]));
          const imported = { ...space, id, createdAt: Date.now(), updatedAt: Date.now(), nodes: space.nodes.map((node) => ({ ...node, prompt: remapMentions(node.prompt, ids), id: ids.get(node.id)!, groupId: node.groupId ? ids.get(node.groupId) : undefined, status: node.status === 'running' ? 'idle' as const : node.status })), edges: space.edges.map((edge) => ({ ...edge, id: `edge_${nanoid(10)}`, source: ids.get(edge.source)!, target: ids.get(edge.target)! })) };
          set((state) => ({ spaces: [...state.spaces, imported], activeSpaceId: id })); return id;
        },
        groupNodes: (spaceId, ids, name) => withSpace(spaceId, (space) => {
          const members = space.nodes.filter((node) => ids.includes(node.id) && node.kind !== 'group');
          if (!members.length) return {};
          const id = `node_${nanoid(10)}`;
          const group: CanvasNodeState = { id, kind: 'group', name, index: nextIndex(space, 'group'), position: { x: 0, y: 0 }, prompt: '', refs: [], model: '', aspectRatio: '1:1', status: 'idle', stale: false };
          const previousGroups = new Set(members.map((node) => node.groupId).filter(Boolean));
          const nodes = space.nodes.map((node) => members.some((member) => member.id === node.id) ? { ...node, groupId: id } : node);
          return { nodes: [...nodes.filter((node) => !previousGroups.has(node.id) || nodes.some((member) => member.groupId === node.id)), group] };
        }),
        ungroupNodes: (spaceId, ids) => withSpace(spaceId, (space) => {
          const groups = new Set(space.nodes.filter((node) => ids.includes(node.id)).map((node) => node.kind === 'group' ? node.id : node.groupId).filter(Boolean));
          return { nodes: space.nodes.filter((node) => !groups.has(node.id)).map((node) => groups.has(node.groupId) ? { ...node, groupId: undefined } : node) };
        }),
        moveNodes: (spaceId, moves) => withSpace(spaceId, (space) => ({
          nodes: space.nodes.map((node) => {
            const move = moves.find((item) => item.id === node.id);
            if (move) return { ...node, position: move.position };
            const groupMove = moves.find((item) => item.id === node.groupId);
            const group = groupMove && space.nodes.find((item) => item.id === groupMove.id);
            return groupMove && group ? { ...node, position: { x: node.position.x + groupMove.position.x - group.position.x, y: node.position.y + groupMove.position.y - group.position.y } } : node;
          }),
        })),
        removeElements: (spaceId, nodeIds, edgeIds) => withSpace(spaceId, (space) => {
          const affected = new Set(nodeIds.flatMap((id) => descendants(space.edges, id)));
          for (const edge of space.edges) if (edgeIds.includes(edge.id)) {
            affected.add(edge.target); for (const id of descendants(space.edges, edge.target)) affected.add(id);
          }
          return {
            nodes: space.nodes.filter((node) => !nodeIds.includes(node.id)).map((node) => ({ ...node, groupId: node.groupId && nodeIds.includes(node.groupId) ? undefined : node.groupId, stale: affected.has(node.id) && (node.output || node.textOutput) ? true : node.stale })),
            edges: space.edges.filter((edge) => !edgeIds.includes(edge.id) && !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)),
          };
        }),
        selectOutput: (spaceId, nodeId, output) => withSpace(spaceId, (space) => {
          const selected = space.nodes.find((node) => node.id === nodeId);
          if (!selected || selected.status === 'running' || JSON.stringify(selected.output) === JSON.stringify(output)) return {};
          return {
            nodes: spreadStale(space, nodeId).map((node) => node.id === nodeId
              ? { ...node, output, batchOutputs: undefined, batchProgress: undefined, status: 'done', error: undefined, stale: false } : node),
          };
        }),
        activeSpaceId: null,

        createSpace: (name) => {
          const id = `space_${nanoid(10)}`;
          const now = Date.now();
          set((state) => ({
            spaces: [
              ...state.spaces,
              { id, name: name?.trim() || '', nodes: [], edges: [], createdAt: now, updatedAt: now },
            ],
            activeSpaceId: id,
          }));
          return id;
        },

        renameSpace: (spaceId, name) => withSpace(spaceId, () => ({ name: name.trim() })),

        deleteSpace: (spaceId) => {
          set((state) => ({
            spaces: state.spaces.filter((space) => space.id !== spaceId),
            activeSpaceId: state.activeSpaceId === spaceId ? null : state.activeSpaceId,
          }));
        },

        openSpace: (spaceId) => set({ activeSpaceId: spaceId }),

        addNode: (spaceId, kind, position) => {
          const id = `node_${nanoid(10)}`;
          withSpace(spaceId, (space) => ({
            nodes: [
              ...space.nodes,
              {
                id,
                kind,
                index: nextIndex(space, kind),
                position: freePosition(space, position),
                prompt: '',
                refs: [],
                model: CANVAS_AUTO_MODEL,
                aspectRatio: kind === 'imageGenerator' || kind === 'videoGenerator' ? '16:9' : DEFAULT_ASPECT_RATIO,
                status: 'idle',
                stale: false,
              },
            ],
          }));
          return id;
        },

        setLocalImage: (spaceId, nodeId, url) => withSpace(spaceId, (space) => ({
          nodes: spreadStale(space, nodeId).map((node) => node.id === nodeId && (node.kind === 'localImage' || node.kind === 'localVideo')
            ? { ...node, status: 'done', stale: false, error: undefined, output: { kind: node.kind === 'localVideo' ? 'video' : 'image', url, model: '', createdAt: Date.now() } }
            : node),
        })),
        pasteNodes: (spaceId, sourceNodes, sourceEdges, offset) => {
          const ids = new Map(sourceNodes.map((node) => [node.id, `node_${nanoid(10)}`]));
          withSpace(spaceId, (space) => {
            const nodes = [...space.nodes];
            for (const source of sourceNodes) {
              nodes.push({ ...source, prompt: remapMentions(source.prompt, ids), groupId: source.groupId ? ids.get(source.groupId) : undefined, outputs: undefined, batchOutputs: undefined, batchProgress: undefined, selectedValue: source.kind === 'selectResult' ? undefined : source.selectedValue, id: ids.get(source.id)!, refs: [...source.refs],
                index: nextIndex({ ...space, nodes }, source.kind),
                position: { x: source.position.x + offset, y: source.position.y + offset },
                status: (source.kind === 'localImage' || source.kind === 'localVideo') && source.output ? 'done' : 'idle', output: (source.kind === 'localImage' || source.kind === 'localVideo') ? source.output : undefined, textOutput: undefined, error: undefined, stale: false });
            }
            const edges = sourceEdges.filter((edge) => ids.has(edge.source) && ids.has(edge.target))
              .map((edge) => ({ ...edge, id: `edge_${nanoid(10)}`, source: ids.get(edge.source)!, target: ids.get(edge.target)! }));
            return { nodes, edges: [...space.edges, ...edges] };
          });
          return [...ids.values()];
        },

        duplicateNode: (spaceId, nodeId) => {
          const space = get().spaces.find((candidate) => candidate.id === spaceId);
          const source = space?.nodes.find((node) => node.id === nodeId);
          if (!space || !source) return null;
          const id = `node_${nanoid(10)}`;
          withSpace(spaceId, (current) => ({
            nodes: [
              ...current.nodes,
              {
                // Settings and prompt carry over; the result does not. A copy
                // that claims someone else's output would go stale the moment
                // it ran, and the wires that produced it were not copied.
                ...source,
                groupId: undefined,
                id,
                index: nextIndex(current, source.kind),
                // Beside the original, not on top of it: a copy you cannot see
                // is indistinguishable from a button that did nothing.
                position: freePosition(current, { x: source.position.x + NODE_WIDTH + 48, y: source.position.y }),
                status: 'idle',
                textOutput: undefined, outputs: undefined, batchOutputs: undefined, batchProgress: undefined, selectedValue: source.kind === 'selectResult' ? undefined : source.selectedValue,
                error: undefined,
                output: (source.kind === 'localImage' || source.kind === 'localVideo') ? source.output : undefined,
                stale: false,
              },
            ],
          }));
          return id;
        },

        updateNode: (spaceId, nodeId, patch) => {
          // Runtime reports do not create undo entries. Only changed generation
          // inputs or a new output invalidate downstream results.
          const isRunnerReport = 'status' in patch || 'output' in patch || 'error' in patch;
          withSpace(spaceId, (space) => {
            const previous = space.nodes.find((node) => node.id === nodeId);
            if (!previous) return {};
            const changed = Object.keys(patch).filter((key) => JSON.stringify(previous[key as keyof CanvasNodeState]) !== JSON.stringify(patch[key as keyof CanvasNodeState]));
            if (!changed.length) return {};
            const affectsOutput = changed.some((key) => ['aiAdapter', 'textOutput', 'imageEdit', 'prompt', 'refs', 'model', 'videoDuration', 'videoMode', 'aspectRatio', 'items', 'valueType', 'selectedValue', 'selectedItem', 'output'].includes(key));
            const base = affectsOutput ? spreadStale(space, nodeId) : space.nodes;
            return {
              nodes: base.map((node) => node.id === nodeId ? {
                ...node, ...patch,
                ...(patch.output ? { outputs: [patch.output, ...(node.outputs || []), ...(node.output ? [node.output] : [])].filter((output, index, all) => all.findIndex((candidate) => candidate.url === output.url) === index).slice(0, 30) } : {}),
              } : node),
            };
          }, !isRunnerReport);
        },

        addRefs: (spaceId, nodeId, paths) => {
          const node = get().spaces.find((space) => space.id === spaceId)?.nodes.find((node) => node.id === nodeId);
          if (node) get().updateNode(spaceId, nodeId, { refs: [...new Set([...node.refs, ...paths])] });
        },

        removeRef: (spaceId, nodeId, path) => {
          const node = get().spaces.find((space) => space.id === spaceId)?.nodes.find((node) => node.id === nodeId);
          if (node) get().updateNode(spaceId, nodeId, { refs: node.refs.filter((ref) => ref !== path) });
        },

        moveNode: (spaceId, nodeId, position) => {
          withSpace(spaceId, (space) => ({
            nodes: space.nodes.map((node) => (node.id === nodeId ? { ...node, position } : node)),
          }));
        },

        removeNode: (spaceId, nodeId) => get().removeElements(spaceId, [nodeId], []),

        connect: (spaceId, connection) => {
          const space = get().spaces.find((candidate) => candidate.id === spaceId);
          if (!space) return;
          if (!canConnect(space.nodes, space.edges, connection)) return;
          const { source, target, targetHandle } = connection;
          if (space.edges.some((edge) => edge.source === source && edge.target === target && edge.targetHandle === targetHandle)) return;
          const port = nodeSpec(space.nodes.find((node) => node.id === target)!)
            .inputs.find((candidate) => candidate.id === targetHandle);
          const edge: CanvasEdgeState = {
            id: `edge_${nanoid(10)}`,
            source,
            target,
            targetHandle: targetHandle!,
          };
          withSpace(spaceId, (current) => {
            // A single-wire port takes the newest wire: dropping a second one on
            // it means "use this instead", not "fail silently".
            const kept = port?.multi
              ? current.edges.filter((existing) => !(existing.target === target && existing.source === source && existing.targetHandle === targetHandle))
              : current.edges.filter((existing) => !(existing.target === target && existing.targetHandle === targetHandle));
            return { edges: [...kept, edge], nodes: spreadStale(current, target) };
          });
        },

        disconnect: (spaceId, edgeId) => {
          withSpace(spaceId, (space) => {
            const removed = space.edges.find((edge) => edge.id === edgeId);
            return {
              edges: space.edges.filter((edge) => edge.id !== edgeId),
              nodes: removed ? spreadStale(space, removed.target).map((node) => node.id === removed.target
                  ? { ...node, prompt: node.prompt.replace(mentionPattern, (token, id) => id === removed.source ? (space.nodes.find((n) => n.id === id)?.name || '') : token) } : node) : space.nodes,
            };
          });
        },
      };
    },
    {
      name: 'video-studio-canvas',
      partialize: (state) => ({ spaces: state.spaces, templates: state.templates, activeSpaceId: state.activeSpaceId }),
      // A node left mid-run when the app closed has no task to reattach to, so
      // it must come back idle rather than spinning forever. `refs` is defaulted
      // here too, because spaces saved before it existed would otherwise hand
      // the renderer an undefined array.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.spaces = state.spaces.map((space) => ({
          ...space,
          nodes: space.nodes.map((node) => ({
            ...node,
            refs: node.refs ?? [],
            status: node.status === 'running' ? ('idle' as const) : node.status,
          })),
        }));
      },
    },
  ),
);

export function getSpace(spaceId: string): CanvasSpace | undefined {
  return useCanvasStore.getState().spaces.find((space) => space.id === spaceId);
}
