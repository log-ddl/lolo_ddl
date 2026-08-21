/**
 * Prompt Compiler
 * Mustache-style template engine for AI prompts
 */

import type { AIScene, AICharacter, GenerationConfig } from '../types';

export interface PromptTemplateConfig {
  sceneImage: string;
  sceneVideo: string;
  negative: string;
}

// Default templates
const DEFAULT_TEMPLATES: PromptTemplateConfig = {
  sceneImage: `{{style_tokens}}, {{character_description}}, {{visual_content}}, {{camera}}, {{quality_tokens}}`,
  sceneVideo: `{{character_description}}, {{visual_content}}, {{action}}, {{camera}}`,
  negative: `blurry, low quality, watermark, text, logo, signature, bad anatomy, deformed, mutated`,
};

export class PromptCompiler {
  private templates: PromptTemplateConfig;

  constructor(customTemplates?: Partial<PromptTemplateConfig>) {
    this.templates = {
      ...DEFAULT_TEMPLATES,
      ...customTemplates,
    };
  }

  /**
   * Compile a template with variables
   */
  compile(templateId: keyof PromptTemplateConfig, variables: Record<string, string | number | undefined>): string {
    const template = this.templates[templateId];
    if (!template) {
      throw new Error(`Template "${templateId}" not found`);
    }
    return this.interpolate(template, variables);
  }

  /**
   * Mustache-style interpolation
   */
  private interpolate(template: string, variables: Record<string, string | number | undefined>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
      const value = variables[key];
      if (value === undefined || value === null) {
        return '';
      }
      return String(value);
    });
  }

  /**
   * Compile image prompt for a scene
   */
  compileSceneImagePrompt(
    scene: AIScene,
    characters: AICharacter[],
    config: GenerationConfig
  ): string {
    // Find character for this scene
    const characterDesc = scene.characterDescription || 
      characters.map(c => c.characterPrompt).join(', ');

    return this.compile('sceneImage', {
      style_tokens: config.styleTokens.join(', '),
      character_description: characterDesc,
      visual_content: scene.visualContent,
      camera: scene.camera,
      quality_tokens: config.qualityTokens.join(', '),
    });
  }

  /**
   * Compile video prompt for a scene
   */
  compileSceneVideoPrompt(
    scene: AIScene,
    characters: AICharacter[]
  ): string {
    const characterDesc = scene.characterDescription || 
      characters.map(c => c.characterPrompt).join(', ');

    return this.compile('sceneVideo', {
      character_description: characterDesc,
      visual_content: scene.visualContent,
      action: scene.action,
      camera: scene.camera,
    });
  }

  /**
   * Get negative prompt
   */
  getNegativePrompt(additionalTerms?: string[]): string {
    let negative = this.templates.negative;
    if (additionalTerms && additionalTerms.length > 0) {
      negative += ', ' + additionalTerms.join(', ');
    }
    return negative;
  }

  /**
   * Update templates at runtime
   */
  updateTemplates(updates: Partial<PromptTemplateConfig>): void {
    this.templates = {
      ...this.templates,
      ...updates,
    };
  }

  /**
   * Get current templates (for debugging/export)
   */
  getTemplates(): PromptTemplateConfig {
    return { ...this.templates };
  }
}

// Singleton instance with default config
export const promptCompiler = new PromptCompiler();
