import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ScriptSkillAsset, ScriptSkillMergeMode, ScriptSkillOutputTarget } from '@/features/video-studio/types/script-skill';
import { normalizeScriptSkillMeta } from '@/features/video-studio/lib/script/script-skill-validation';

interface ScriptSkillState {
  skills: ScriptSkillAsset[];
  selectedSkillId: string | null;
}

interface ScriptSkillActions {
  addSkill: (skill: { name: string; content: string; outputs?: ScriptSkillOutputTarget[]; mergeMode?: ScriptSkillMergeMode }) => string;
  updateSkill: (id: string, updates: Partial<Omit<ScriptSkillAsset, 'id' | 'createdAt'>>) => void;
  deleteSkill: (id: string) => void;
  selectSkill: (id: string | null) => void;
  getSelectedSkill: () => ScriptSkillAsset | undefined;
  getSkillById: (id: string) => ScriptSkillAsset | undefined;
}

type ScriptSkillStore = ScriptSkillState & ScriptSkillActions;

function inferSkillName(content: string, fallback: string): string {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || fallback;
}

export const useScriptSkillStore = create<ScriptSkillStore>()(
  persist(
    (set, get) => ({
      skills: [],
      selectedSkillId: null,

      addSkill: (skillData) => {
        const meta = normalizeScriptSkillMeta({ outputs: skillData.outputs, mergeMode: skillData.mergeMode });
        const id = `script_skill_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = Date.now();
        const skill: ScriptSkillAsset = {
          id,
          name: skillData.name.trim() || inferSkillName(skillData.content, 'Untitled Skill'),
          content: skillData.content,
          outputs: meta.outputs,
          mergeMode: meta.mergeMode,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ skills: [...state.skills, skill], selectedSkillId: id }));
        return id;
      },

      updateSkill: (id, updates) => {
        set((state) => ({
          skills: state.skills.map((skill) =>
            skill.id === id ? { ...skill, ...updates, updatedAt: Date.now() } : skill
          ),
        }));
      },

      deleteSkill: (id) => {
        set((state) => ({
          skills: state.skills.filter((skill) => skill.id !== id),
          selectedSkillId: state.selectedSkillId === id ? null : state.selectedSkillId,
        }));
      },

      selectSkill: (id) => set({ selectedSkillId: id }),
      getSelectedSkill: () => {
        const state = get();
        return state.selectedSkillId ? state.skills.find((skill) => skill.id === state.selectedSkillId) : undefined;
      },
      getSkillById: (id) => get().skills.find((skill) => skill.id === id),
    }),
    {
      name: 'longdd-script-skills',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        skills: state.skills,
        selectedSkillId: state.selectedSkillId,
      }),
    }
  )
);
