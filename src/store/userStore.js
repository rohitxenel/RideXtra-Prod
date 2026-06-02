import { create } from "zustand";

export const useUserStore = create((set) => ({
  users: [],
  setUsers: (data) => set({ users: data }),
  currentPage: 1,
  setCurrentPage: (page) => set({ currentPage: page }),
  totalPages: 1,
  setTotalPages: (pages) => set({ totalPages: pages }),
}));
