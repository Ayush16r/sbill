import { create } from 'zustand';

export interface GroupMemberInfo {
  userId: string;
  name: string;
  avatar?: string | null;
  role: 'ADMIN' | 'MEMBER';
  balance: number;
}

export interface GroupInfo {
  id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  category: string;
  inviteCode: string;
  createdById: string;
  totalExpense: number;
  isArchived: boolean;
  createdAt: string;
  userBalance: number;
  membersCount: number;
  members: GroupMemberInfo[];
  expenses?: any[];
}

interface GroupState {
  groups: GroupInfo[];
  activeGroup: GroupInfo | null;
  setGroups: (groups: GroupInfo[]) => void;
  setActiveGroup: (group: GroupInfo | null) => void;
  addGroup: (group: GroupInfo) => void;
  updateGroup: (group: GroupInfo) => void;
  removeGroup: (groupId: string) => void;
  clearGroups: () => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  activeGroup: null,
  setGroups: (groups) => set({ groups }),
  setActiveGroup: (activeGroup) => set({ activeGroup }),
  addGroup: (group) => set((state) => ({ groups: [group, ...state.groups] })),
  updateGroup: (group) =>
    set((state) => ({
      groups: state.groups.map((g) => (g.id === group.id ? group : g)),
    })),
  removeGroup: (groupId) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
    })),
  clearGroups: () => set({ groups: [], activeGroup: null }),
}));
