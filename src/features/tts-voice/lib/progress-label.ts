const PROGRESS_KEYS: Record<string, string> = {
  starting: 'tts.progress.starting',
  'runtime.python.download': 'tts.progress.pythonDownload',
  'runtime.python.install': 'tts.progress.pythonInstall',
  'runtime.python.migrate': 'tts.progress.pythonMigrate',
  'runtime.venv': 'tts.progress.venv',
  'runtime.pip': 'tts.progress.pip',
  'runtime.dependencies': 'tts.progress.dependencies',
  'runtime.accelerator': 'tts.progress.accelerator',
  'model.download': 'tts.progress.modelDownload',
  loading: 'tts.progress.loading',
  'voice-prompt': 'tts.progress.voicePrompt',
  generating: 'tts.progress.generating',
  'line-generating': 'tts.progress.lineGenerating',
  'sentence-generating': 'tts.progress.sentenceGenerating',
  chunking: 'tts.progress.chunking',
  merging: 'tts.progress.merging',
  saving: 'tts.progress.saving',
  done: 'tts.progress.done',
  'vbee-submitting': 'tts.progress.vbeeSubmitting',
  'vbee-processing': 'tts.progress.vbeeProcessing',
  'vbee-downloading': 'tts.progress.vbeeDownloading',
  'vbee-done': 'tts.progress.vbeeDone',
};

export function getTtsProgressLabel(stage: string, t: (key: string) => string) {
  return t(PROGRESS_KEYS[stage] || 'tts.progress.default');
}
