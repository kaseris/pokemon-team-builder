export type LearnMethod = 'level-up' | 'machine' | 'egg' | 'tutor' | 'other';

export type LearnableMove = {
  name: string;
  methods: LearnMethod[];
  minLevel?: number;
  type?: string;
  category?: string;
  power?: number | null;
  accuracy?: number | true | null;
};

export const LEARN_METHOD_LABELS: Record<LearnMethod, string> = {
  'level-up': 'Level-up',
  machine: 'TM',
  egg: 'Egg',
  tutor: 'Tutor',
  other: 'Other',
};
