import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface AutopilotSkillAsset {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface AutopilotSkillStore {
  skills: AutopilotSkillAsset[];
  selectedSkillId: string | null;
  addSkill: (input: { name: string; content: string }) => string;
  updateSkill: (id: string, updates: Pick<AutopilotSkillAsset, 'name' | 'content'>) => void;
  deleteSkill: (id: string) => void;
  selectSkill: (id: string | null) => void;
}

export const useAutopilotSkillStore = create<AutopilotSkillStore>()(
  persist(
    (set) => ({
      skills: [],
      selectedSkillId: null,
      addSkill: ({ name, content }) => {
        const id = `autopilot_skill_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const now = Date.now();
        set((state) => ({
          skills: [...state.skills, { id, name: name.trim(), content, createdAt: now, updatedAt: now }],
          selectedSkillId: id,
        }));
        return id;
      },
      updateSkill: (id, updates) => set((state) => ({
        skills: state.skills.map((skill) => skill.id === id
          ? { ...skill, name: updates.name.trim(), content: updates.content, updatedAt: Date.now() }
          : skill),
      })),
      deleteSkill: (id) => set((state) => ({
        skills: state.skills.filter((skill) => skill.id !== id),
        selectedSkillId: state.selectedSkillId === id ? null : state.selectedSkillId,
      })),
      selectSkill: (id) => set({ selectedSkillId: id }),
    }),
    {
      name: 'longdd-autopilot-skills',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ skills: state.skills, selectedSkillId: state.selectedSkillId }),
    },
  ),
);
