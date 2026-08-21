export interface AvailableUpdateInfo {
  currentVersion: string;
  latestVersion: string;
  releaseNotes?: string;
  publishedAt?: string;
}

export type UpdateDownloadResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export type UpdateCheckResult =
  | {
      success: true;
      currentVersion: string;
      hasUpdate: boolean;
      update: AvailableUpdateInfo | null;
    }
  | {
      success: false;
      currentVersion: string;
      error: string;
    };

export type OpenExternalResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };
