import { isUuid } from './protocol';

function walk(value: unknown, visitor: (record: Record<string, unknown>) => string | undefined): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = walk(item, visitor);
      if (found) return found;
    }
    return undefined;
  }
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const direct = visitor(record);
  if (direct) return direct;
  for (const child of Object.values(record)) {
    const found = walk(child, visitor);
    if (found) return found;
  }
  return undefined;
}

export function extractFlowProjectId(value: unknown): string | undefined {
  return walk(value, (record) => {
    for (const key of ['projectId', 'project_id', 'id']) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.length >= 8) return candidate;
    }
    return undefined;
  });
}

export function extractFlowMediaId(value: unknown): string | undefined {
  return walk(value, (record) => {
    for (const key of ['mediaId', 'name']) {
      const candidate = record[key];
      if (isUuid(candidate)) return candidate;
    }
    return undefined;
  });
}

export function extractFlowUrl(value: unknown): string | undefined {
  return walk(value, (record) => {
    for (const key of ['fifeUrl', 'servingUri', 'fileUrl', 'url']) {
      const candidate = record[key];
      if (typeof candidate === 'string' && /^https:\/\//i.test(candidate)) return candidate;
    }
    return undefined;
  });
}

export type ParsedOperation = {
  raw: Record<string, unknown>;
  workflowMode: boolean;
  primaryMediaId?: string;
  /** Flow's workflow name; project polling matches media by workflowId. */
  workflowName?: string;
};

export function extractFlowOperations(value: unknown): ParsedOperation[] {
  const root = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const data = (root.data && typeof root.data === 'object' ? root.data : root) as Record<string, unknown>;
  if (Array.isArray(data.operations)) {
    return data.operations.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((raw) => ({ raw, workflowMode: false }));
  }
  if (!Array.isArray(data.workflows)) return [];
  return data.workflows.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const workflow = item as Record<string, unknown>;
    const metadata = (workflow.metadata && typeof workflow.metadata === 'object' ? workflow.metadata : {}) as Record<string, unknown>;
    const primaryMediaId = metadata.primaryMediaId;
    if (!isUuid(primaryMediaId)) return [];
    return [{
      workflowMode: true,
      primaryMediaId,
      workflowName: typeof workflow.name === 'string' ? workflow.name : undefined,
      raw: {
        operation: { name: workflow.name, metadata: { video: { mediaId: primaryMediaId } } },
        status: 'MEDIA_GENERATION_STATUS_PENDING',
      },
    }];
  });
}

export function operationStatus(operation: Record<string, unknown>): string {
  return typeof operation.status === 'string' ? operation.status : '';
}

export function decodeVerifiedMp4(encoded: unknown): Buffer | undefined {
  if (typeof encoded !== 'string' || encoded.length > 300_000_000) return undefined;
  try {
    const bytes = Buffer.from(encoded, 'base64');
    return bytes.length >= 12 && bytes.subarray(4, 8).toString('ascii') === 'ftyp' ? bytes : undefined;
  } catch {
    return undefined;
  }
}
