/**
 * Canvas: a node graph for building images and videos by wiring nodes together.
 *
 * Deliberately not bound to a Video Studio project. A space is its own unit of
 * work and its id is what goes to Flow as the `projectId`, so one canvas holds
 * as many Flow projects as it has spaces. Nothing here reads the project store.
 *
 * Also deliberately not shared with the Buzz pipeline: Buzz is a straight chain
 * that hands over through files, this is a DAG that hands over media URLs.
 */

export type PortType = 'text' | 'image' | 'video';

export type CanvasNodeKind = 'text' | 'imageGenerator' | 'videoGenerator' | 'localImage' | 'localVideo' | 'note' | 'group' | 'reference' | 'list' | 'router' | 'selectResult' | 'imageEdit' | 'output' | 'ai';

export interface PortSpec {
  accepts?: PortType[];
  id: string;
  type: PortType;
  labelKey: string;
  /** More than one wire may land here. They are joined in the order they were drawn. */
  multi?: boolean;
}

export interface NodeSpec {
  kind: CanvasNodeKind;
  labelKey: string;
  inputs: PortSpec[];
  /** null = nothing to hand downstream. */
  output: PortType | null;
}

/**
 * The single source of truth for what may connect to what. The picker, the
 * connection validator and the handle renderer all read this table, so a port
 * added here shows up in all three without being declared three times.
 */
export const NODE_SPECS: Record<CanvasNodeKind, NodeSpec> = {
  ai: { kind: 'ai', labelKey: 'canvas.node.ai', inputs: [{ id: 'prompt', type: 'text', labelKey: 'canvas.port.prompt', multi: true }, { id: 'refs', type: 'image', labelKey: 'canvas.port.refs', multi: true }], output: 'text' },
  output: { kind: 'output', labelKey: 'canvas.node.output', inputs: [{ id: 'media', type: 'image', accepts: ['image', 'video'], labelKey: 'canvas.output.media', multi: true }], output: null },
  reference: { kind: 'reference', labelKey: 'canvas.node.reference', inputs: [{ id: 'refs', type: 'image', labelKey: 'canvas.port.refs', multi: true }], output: 'image' },
  list: { kind: 'list', labelKey: 'canvas.node.list', inputs: [{ id: 'items', type: 'text', labelKey: 'canvas.items', multi: true }], output: 'text' },
  router: { kind: 'router', labelKey: 'canvas.node.router', inputs: [{ id: 'items', type: 'text', labelKey: 'canvas.items' }], output: 'text' },
  selectResult: { kind: 'selectResult', labelKey: 'canvas.node.selectResult', inputs: [{ id: 'items', type: 'image', labelKey: 'canvas.items', multi: true }], output: 'image' },
  imageEdit: { kind: 'imageEdit', labelKey: 'canvas.node.imageEdit', inputs: [{ id: 'prompt', type: 'text', labelKey: 'canvas.port.prompt', multi: true }, { id: 'refs', type: 'image', labelKey: 'canvas.port.refs', multi: true }], output: 'image' },
  note: { kind: 'note', labelKey: 'canvas.node.note', inputs: [], output: null },
  group: { kind: 'group', labelKey: 'canvas.node.group', inputs: [], output: null },
  localVideo: { kind: 'localVideo', labelKey: 'canvas.node.localVideo', inputs: [], output: 'video' },
  localImage: { kind: 'localImage', labelKey: 'canvas.node.localImage', inputs: [], output: 'image' },
  text: {
    kind: 'text',
    labelKey: 'canvas.node.text',
    inputs: [],
    output: 'text',
  },
  imageGenerator: {
    kind: 'imageGenerator',
    labelKey: 'canvas.node.imageGenerator',
    inputs: [
      { id: 'prompt', type: 'text', labelKey: 'canvas.port.prompt', multi: true },
      { id: 'refs', type: 'image', labelKey: 'canvas.port.refs', multi: true },
    ],
    output: 'image',
  },
  videoGenerator: {
    kind: 'videoGenerator',
    labelKey: 'canvas.node.videoGenerator',
    inputs: [
      { id: 'prompt', type: 'text', labelKey: 'canvas.port.prompt', multi: true },
      { id: 'start', type: 'image', labelKey: 'canvas.port.startFrame' },
      { id: 'end', type: 'image', labelKey: 'canvas.port.endFrame' },
    ],
    output: 'video',
  },
};

export const CANVAS_NODE_KINDS: CanvasNodeKind[] = ['imageGenerator', 'videoGenerator', 'text', 'ai', 'imageEdit', 'output', 'localImage', 'localVideo', 'reference', 'list', 'router', 'selectResult', 'note'];

export const CANVAS_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'] as const;

/** Empty model means "Auto": take the head model from Settings for that kind. */
export const CANVAS_AUTO_MODEL = '';

export type NodeStatus = 'idle' | 'running' | 'done' | 'failed';

export interface NodeOutput {
  backgroundSkipped?: boolean;
  accountEmail?: string;
  /** Snapshot of the actual inputs used for this result. Absent on older results. */
  prompt?: string;
  aspectRatio?: string;
  kind: 'image' | 'video';
  url: string;
  /** The model that actually produced this, which is not always the one asked for. */
  model: string;
  taskId?: string;
  mediaId?: string;
  createdAt: number;
}

export interface CanvasNodeState {
  textOutput?: string;
  aiAdapter?: 'claude' | 'opencode' | 'codex';
  outputDirectory?: string;
  savedFiles?: string[];
  imageEdit?: import('./image-processing').ImageEditSettings;
  videoMode?: 'first' | 'ref';
  videoDuration?: number;
  valueType?: PortType;
  items?: string[];
  selectedItem?: number;
  selectedValue?: string;
  collapsed?: boolean;
  batchProgress?: { done: number; total: number };
  batchOutputs?: NodeOutput[];
  name?: string;
  groupId?: string;
  width?: number;
  height?: number;
  phase?: 'queued' | 'uploading' | 'submitting' | 'polling' | 'downloading';
  phaseStartedAt?: number;
  outputs?: NodeOutput[];
  startedAt?: number;
  accountEmail?: string;
  id: string;
  kind: CanvasNodeKind;
  /** Display number, e.g. `Image Generator #2`. Assigned per kind, never reused. */
  index: number;
  position: { x: number; y: number };
  prompt: string;
  /** User-edited complete prompt; do not append connected text again. */
  promptIsFinal?: boolean;
  accountOwnerScopeId?: string;
  accountLabel?: string;
  /**
   * Reference images the user attached by hand, as `local-image://` paths.
   * Kept apart from wired references so pulling a wire never drops a file the
   * user picked, and stored as paths rather than base64 because the whole space
   * lives in localStorage.
   */
  refs: string[];
  model: string;
  aspectRatio: string;
  status: NodeStatus;
  error?: string;
  output?: NodeOutput;
  /**
   * The output no longer matches the inputs: prompt, model or an upstream node
   * changed after the last successful run. Kept so a stale result stays visible
   * instead of being thrown away — the user decides when to spend quota again.
   */
  stale: boolean;
}

export interface CanvasEdgeState {
  mention?: boolean;
  id: string;
  source: string;
  target: string;
  targetHandle: string;
}

export interface CanvasSpace {
  viewport?: { x: number; y: number; zoom: number };
  id: string;
  name: string;
  nodes: CanvasNodeState[];
  edges: CanvasEdgeState[];
  createdAt: number;
  updatedAt: number;
}

export function nodeSpec(node: CanvasNodeState): NodeSpec {
  const spec = NODE_SPECS[node.kind];
  // Ref reuses the start-image handle, but collects images instead of replacing
  // the previous frame. Keep the handle id stable for saved graphs.
  if (node.kind === 'videoGenerator' && node.videoMode === 'ref') {
    return { ...spec, inputs: spec.inputs.map((port) => port.id === 'start' ? { ...port, multi: true } : port) };
  }
  if (['list', 'router', 'selectResult'].includes(node.kind)) {
    const type = node.valueType || (node.kind === 'selectResult' ? 'image' : 'text');
    return { ...spec, output: type, inputs: spec.inputs.map((port) => ({ ...port, type })) };
  }
  return spec;
}

export function outputTypeOf(node: CanvasNodeKind | CanvasNodeState): PortType | null {
  return typeof node === 'string' ? NODE_SPECS[node].output : nodeSpec(node).output;
}

export function portSpec(node: CanvasNodeKind | CanvasNodeState, portId: string): PortSpec | undefined {
  if ((typeof node === 'string' ? node : node.kind) === 'output' && ['images', 'videos'].includes(portId)) portId = 'media';
  return (typeof node === 'string' ? NODE_SPECS[node] : nodeSpec(node)).inputs.find((port) => port.id === portId);
}

/** Node kinds with at least one input that accepts `type`. Drives the picker. */
export function kindsAccepting(type: PortType): CanvasNodeKind[] {
  return CANVAS_NODE_KINDS.filter((kind) => (['list', 'router'].includes(kind) || (kind === 'selectResult' && type !== 'text')) || NODE_SPECS[kind].inputs.some((port) => (port.accepts || [port.type]).includes(type)));
}

export function isGenerator(kind: CanvasNodeKind) { return kind === 'imageGenerator' || kind === 'videoGenerator' || kind === 'imageEdit' || kind === 'output' || kind === 'ai'; }
