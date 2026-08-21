/**
 * Buzz — dây chuyền agent do user tự xếp.
 *
 * Mô hình: user tạo Agent (preset CLI + system prompt), xếp chúng thành Pipeline
 * (chuỗi Step thẳng), mỗi Step có một Gate QC. Gate pass thì chạy tiếp, fail thì
 * dừng / chạy lại / quay về step trước tuỳ cấu hình.
 *
 * Nguyên tắc: các step KHÔNG truyền context cho nhau. Mỗi step ghi kết quả ra một
 * file trong workspace chung, step sau đọc file đó. Context vì thế không phình
 * theo số bước.
 */

export type BuzzAdapter = 'claude' | 'opencode' | 'codex';

/** Preset agent tái sử dụng được giữa các pipeline. */
export interface BuzzAgent {
  id: string;
  /** Tên hiển thị, ví dụ "Nghiên cứu". */
  name: string;
  /** Mô tả ngắn vai trò, chỉ để user nhớ. */
  role: string;
  adapter: BuzzAdapter;
  /** '' = dùng model mặc định của CLI. */
  model: string;
  /** '' = dùng effort mặc định của CLI. */
  effort: string;
  systemPrompt: string;
  createdAt: number;
  updatedAt: number;
}

export type BuzzInputKind = 'text' | 'file' | 'folder';

export interface BuzzInputNode {
  id: string;
  type: 'input';
  kind: BuzzInputKind;
  name: string;
  position: { x: number; y: number };
  /** Text cố định, hoặc để trống để lấy đề bài nhập trước khi chạy. */
  value: string;
  /** Đường dẫn file/folder tương đối với workspace hoặc đường dẫn tuyệt đối trong workspace. */
  path: string;
}

export type BuzzFunctionKind = 'merge' | 'condition' | 'loop';

export type BuzzConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'regex'
  | 'exists'
  | 'truthy'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte';

export interface BuzzFunctionNode {
  id: string;
  type: 'function';
  kind: BuzzFunctionKind;
  name: string;
  position: { x: number; y: number };
  /** Đường dẫn field trong JSON, ví dụ result.passed; rỗng = dùng toàn bộ input. */
  field?: string;
  operator?: BuzzConditionOperator;
  compareValue?: string;
  /** Condition: số lần tối đa node được đánh giá; Loop: số lượt quay lại tối đa. */
  maxIterations?: number;
}

export interface BuzzConnection {
  id: string;
  source: string;
  target: string;
  /** Cổng điều khiển của If/Loop. */
  sourceHandle?: 'true' | 'false' | 'loop' | 'done' | null;
  /** Dây quay về node đã chạy; runner không coi đây là dependency ban đầu. */
  loop?: boolean;
}

export type GateKind = 'none' | 'rule' | 'agent' | 'human';

/** Kiểm tra bằng luật — chắc chắn, không tốn token. Mọi field đã đặt đều phải đạt. */
export interface RuleGate {
  /** File output của step phải tồn tại trong workspace. */
  requireOutputFile: boolean;
  /** Số ký tự tối thiểu của file output (0 = bỏ qua). */
  minLength: number;
  /** Regex bắt buộc khớp ('' = bỏ qua). */
  mustMatch: string;
  /** Regex không được khớp — dùng để chặn placeholder kiểu "TODO" ('' = bỏ qua). */
  mustNotMatch: string;
  /** Nội dung phải parse được thành JSON. */
  jsonValid: boolean;
}

export interface StepGate {
  kind: GateKind;
  /** Vị trí node QC trên canvas; gate vẫn thuộc step để runner cũ tương thích. */
  position?: { x: number; y: number };
  rule: RuleGate;
  /** Agent đóng vai người kiểm duyệt khi kind === 'agent'. */
  judgeAgentId: string;
  /** Tiêu chí chấm cho agent QC. */
  judgePrompt: string;
}

/** Xử lý khi gate fail. */
export type OnFail =
  /** Dừng cả pipeline. */
  | 'stop'
  /** Chạy lại chính step này, kèm feedback của QC. */
  | 'retry'
  /** Quay về một step trước rồi chạy xuôi lại. */
  | 'goto'
  /** Bỏ qua, vẫn chạy tiếp step sau. */
  | 'continue';

export type BuzzAgentOutputKind = 'text' | 'file' | 'folder';

export interface BuzzStep {
  id: string;
  name: string;
  /** Vị trí hiển thị trên canvas; không ảnh hưởng thứ tự chạy của pipeline. */
  position?: { x: number; y: number };
  /** Chỉ nhận biến {{topic}} khi có dây nối từ Input node trên canvas. */
  topicInput?: boolean;
  agentId: string;
  /** Prompt template. Biến: {{topic}} {{input}} {{output}} {{feedback}} */
  prompt: string;
  /** File step phải ghi ra, tương đối so với workspace. */
  outputFile: string;
  /** Kiểu đầu ra: phản hồi trực tiếp, một tệp bất kỳ, hoặc cả thư mục. */
  outputKind?: BuzzAgentOutputKind;
  /** Step trước mà step này cần đọc file output của chúng. */
  inputStepIds: string[];
  gate: StepGate;
  onFail: OnFail;
  /** Số lần chạy lại tối đa trước khi bỏ cuộc (áp dụng cho retry/goto). */
  maxRetries: number;
  /** Step quay về khi onFail === 'goto'. */
  gotoStepId: string;
}

export interface BuzzPipeline {
  id: string;
  name: string;
  description: string;
  steps: BuzzStep[];
  inputNodes?: BuzzInputNode[];
  functionNodes?: BuzzFunctionNode[];
  connections?: BuzzConnection[];
  /** null = workspace mặc định của app. */
  workspacePath: string | null;
  createdAt: number;
  updatedAt: number;
}

export type RunStepStatus =
  | 'pending'
  | 'running'
  | 'checking'
  | 'awaiting'
  | 'passed'
  | 'failed'
  | 'skipped';

export interface RunStepState {
  stepId: string;
  name: string;
  agentName: string;
  status: RunStepStatus;
  /** Lần chạy thứ mấy, bắt đầu từ 1. */
  attempt: number;
  /** Text agent trả về (đã cắt bớt khi lưu). */
  output: string;
  gateVerdict?: 'pass' | 'fail';
  gateReason?: string;
  error?: string;
  startedAt?: number;
  finishedAt?: number;
  /** Fingerprint của toàn bộ input/config dùng cho lượt chạy node này. */
  inputFingerprint?: string;
  /** Artifact đã được runtime xác minh sau khi CLI kết thúc. */
  artifact?: {
    kind: BuzzAgentOutputKind;
    path?: string;
    fingerprint: string;
    fileCount: number;
    totalBytes: number;
  };
}

export interface BuzzRunInputManifest {
  nodeId: string;
  name: string;
  kind: 'file' | 'folder';
  sourcePath: string;
  resolvedPath: string;
  staged: boolean;
  fileCount: number;
  totalBytes: number;
  fingerprint: string;
  files: string[];
  filesTruncated: boolean;
}

export type RunStatus = 'running' | 'awaiting' | 'paused' | 'done' | 'failed';

export interface BuzzRun {
  id: string;
  pipelineId: string;
  pipelineName: string;
  /** Đề bài user nhập cho lần chạy này. */
  topic: string;
  workspacePath: string | null;
  status: RunStatus;
  steps: RunStepState[];
  currentStepId: string | null;
  startedAt: number;
  finishedAt?: number;
  /** Đếm tổng lượt chạy step để chặn vòng lặp vô tận. */
  stepRuns: number;
  error?: string;
  /** Đổi khi input, graph, prompt hoặc cấu hình agent thay đổi. */
  pipelineFingerprint?: string;
  inputManifest?: BuzzRunInputManifest[];
}

/** Trần cứng chặn pipeline lặp vô tận vì goto/retry. */
export const MAX_STEP_RUNS = 60;
/** Độ dài output lưu vào store (ký tự) — bản đầy đủ vẫn nằm ở file trong workspace. */
export const MAX_STORED_OUTPUT = 20000;
/** Số ký tự file input đưa cho agent QC đọc. */
export const MAX_JUDGE_INPUT = 24000;

export function emptyRule(): RuleGate {
  return {
    requireOutputFile: true,
    minLength: 0,
    mustMatch: '',
    mustNotMatch: '',
    jsonValid: false,
  };
}

export function emptyGate(): StepGate {
  return { kind: 'none', rule: emptyRule(), judgeAgentId: '', judgePrompt: '' };
}

export const ADAPTER_LABELS: Record<BuzzAdapter, string> = {
  claude: 'Claude CLI',
  opencode: 'OpenCode CLI',
  codex: 'Codex CLI',
};

export const GATE_LABELS: Record<GateKind, string> = {
  none: 'Không kiểm tra',
  rule: 'QC bằng code / luật',
  agent: 'Agent QC chấm',
  human: 'Người duyệt',
};

export const ON_FAIL_LABELS: Record<OnFail, string> = {
  stop: 'Dừng pipeline',
  retry: 'Chạy lại step này',
  goto: 'Quay về step trước',
  continue: 'Bỏ qua, chạy tiếp',
};
