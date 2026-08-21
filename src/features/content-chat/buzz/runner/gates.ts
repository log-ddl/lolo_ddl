import { runCliTextTask } from '@/features/video-studio/lib/cli-runtime';
import { MAX_JUDGE_INPUT, type BuzzAgent, type BuzzRun, type BuzzStep } from '../types';
import { useBuzzStore } from '../buzz-store';
import { readArtifact, truncate } from './prompt';
import { JUDGE_TIMEOUT_MS, getSignal, setHumanGateResolver } from './state';

/**
 * QC gates between steps: a cheap rule check, an AI judge, or a human approval
 * that parks the run until the user answers.
 */

export interface GateResult {
  pass: boolean;
  reason: string;
}

export async function evaluateRuleGate(
  step: BuzzStep,
  workspacePath: string | null,
  fallbackOutput: string,
): Promise<GateResult> {
  const rule = step.gate.rule;
  const artifact = await readArtifact(workspacePath, step.outputFile);

  if (rule.requireOutputFile && step.outputFile.trim() && artifact === null) {
    return { pass: false, reason: `Không tìm thấy hoặc không đọc được file "${step.outputFile}".` };
  }
  // Không bắt buộc file thì chấm trên chính text agent trả về.
  const content = artifact ?? fallbackOutput;

  if (rule.minLength > 0 && content.trim().length < rule.minLength) {
    return {
      pass: false,
      reason: `Nội dung quá ngắn: ${content.trim().length} ký tự, yêu cầu tối thiểu ${rule.minLength}.`,
    };
  }
  if (rule.jsonValid) {
    try {
      JSON.parse(content.trim());
    } catch {
      return { pass: false, reason: 'Nội dung không phải JSON hợp lệ.' };
    }
  }
  if (rule.mustMatch.trim()) {
    try {
      if (!new RegExp(rule.mustMatch, 'i').test(content)) {
        return { pass: false, reason: `Nội dung không khớp mẫu bắt buộc: ${rule.mustMatch}` };
      }
    } catch {
      return { pass: false, reason: `Regex "mustMatch" không hợp lệ: ${rule.mustMatch}` };
    }
  }
  if (rule.mustNotMatch.trim()) {
    try {
      if (new RegExp(rule.mustNotMatch, 'i').test(content)) {
        return { pass: false, reason: `Nội dung chứa mẫu bị cấm: ${rule.mustNotMatch}` };
      }
    } catch {
      return { pass: false, reason: `Regex "mustNotMatch" không hợp lệ: ${rule.mustNotMatch}` };
    }
  }
  return { pass: true, reason: 'Đạt mọi điều kiện kiểm tra.' };
}

export async function evaluateAgentGate(
  step: BuzzStep,
  judge: BuzzAgent,
  workspacePath: string | null,
  runId: string,
  attempt: number,
  fallbackOutput: string,
): Promise<GateResult> {
  const artifact = await readArtifact(workspacePath, step.outputFile);
  const content = truncate(artifact ?? fallbackOutput, MAX_JUDGE_INPUT);
  if (!content.trim()) {
    return { pass: false, reason: 'Không có nội dung để chấm.' };
  }

  const prompt = [
    'Bạn đang chấm kết quả của một bước trong dây chuyền sản xuất nội dung.',
    '',
    'TIÊU CHÍ:',
    step.gate.judgePrompt.trim() || 'Đánh giá xem kết quả có đạt yêu cầu chuyên môn không.',
    '',
    'NỘI DUNG CẦN CHẤM:',
    '"""',
    content,
    '"""',
    '',
    'Trả lời theo đúng định dạng sau, không thêm gì khác:',
    'VERDICT: PASS hoặc FAIL',
    'REASON: <một đến ba câu nêu lý do; nếu FAIL thì chỉ rõ phải sửa gì>',
  ].join('\n');

  const raw = await runCliTextTask({
    adapter: judge.adapter,
    prompt,
    systemPrompt: judge.systemPrompt || undefined,
    model: judge.model || undefined,
    effort: judge.effort || undefined,
    // Session mới mỗi lần chấm: agent QC không được nhìn thấy quá trình agent viết,
    // nếu không nó sẽ thiên vị và gật cho qua.
    sessionKey: `buzz-judge:${runId}:${step.id}:${attempt}`,
    timeoutMs: JUDGE_TIMEOUT_MS,
    workingDirectory: workspacePath ?? undefined,
    enableContentMcp: true,
    signal: getSignal(),
  });

  const verdict = /VERDICT\s*:\s*(PASS|FAIL)/i.exec(raw)?.[1]?.toUpperCase();
  const reason = /REASON\s*:\s*([\s\S]+)/i.exec(raw)?.[1]?.trim() || raw.trim();
  if (verdict === 'PASS') return { pass: true, reason: truncate(reason, 2000) };
  if (verdict === 'FAIL') return { pass: false, reason: truncate(reason, 2000) };
  // Agent không trả đúng định dạng — coi như fail để user biết mà sửa prompt chấm,
  // an toàn hơn là mặc định cho qua.
  return { pass: false, reason: `Agent QC không trả đúng định dạng VERDICT. Nó trả về: ${truncate(raw.trim(), 600)}` };
}

export function waitForHumanGate(): Promise<GateResult> {
  return new Promise((resolve) => {
    setHumanGateResolver((verdict) => resolve({ pass: verdict.pass, reason: verdict.reason }));
  });
}

export async function evaluateGate(
  step: BuzzStep,
  run: BuzzRun,
  attempt: number,
  output: string,
): Promise<GateResult> {
  const store = useBuzzStore.getState();
  switch (step.gate.kind) {
    case 'none':
      return { pass: true, reason: '' };
    case 'rule':
      return evaluateRuleGate(step, run.workspacePath, output);
    case 'agent': {
      const judge = store.agents.find((agent) => agent.id === step.gate.judgeAgentId);
      if (!judge) return { pass: false, reason: 'Chưa chọn agent QC cho bước này.' };
      return evaluateAgentGate(step, judge, run.workspacePath, run.id, attempt, output);
    }
    case 'human': {
      store.patchRunStep(run.id, step.id, { status: 'awaiting' });
      store.patchRun(run.id, { status: 'awaiting' });
      const result = await waitForHumanGate();
      store.patchRun(run.id, { status: 'running' });
      return result;
    }
    default:
      return { pass: true, reason: '' };
  }
}

