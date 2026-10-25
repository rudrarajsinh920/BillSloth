// Secure frontend bridge for BillSloth AI configuration
// All AI inference and API keys are strictly retained on the Express backend

export const GEMMA_PRIMARY_MODEL = 'gemma-4-26b-a4b-it';
export type AiEngineType = 'gemma' | 'browser';

export function getActiveAiEngine(): AiEngineType {
  return 'gemma';
}

export function setActiveAiEngine(_engine: AiEngineType): void {
  // Configured on backend via AI_MODEL
}
