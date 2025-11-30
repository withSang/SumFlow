import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Sheet {
  id: string;
  name: string;
  content: string;
  lastModified: number;
}

interface SheetState {
  sheets: Sheet[];
  activeSheetId: string;
  
  // History for Undo/Redo (Active Sheet Only)
  history: Record<string, { past: string[], future: string[] }>;
  
  // Theme
  theme: 'dark' | 'light';

  // Actions
  addSheet: () => void;
  addWelcomeSheet: () => void;
  deleteSheet: (id: string) => void;
  setActiveSheet: (id: string) => void;
  updateSheetName: (id: string, name: string) => void;
  updateSheetContent: (id: string, content: string) => void;
  importSheets: (sheets: Sheet[]) => void;
  undo: () => void;
  redo: () => void;
  toggleTheme: () => void;
}

const WELCOME_CONTENT = `// Welcome to SumFlow!
// Use this scratchpad for quick math, conversions, and logic.

// 1. Basic Math
Salary = 5000
Bonus = 1000
Total Income = Salary + Bonus

// 2. Percentages
Tax Rate = 20%
Tax = Total Income * Tax Rate
Net Income = Total Income - Tax

// 3. Unit Conversions
// You can mix units freely
Walk = 5 km + 500 m
Drive = 20 miles
Total Distance = Walk + Drive in km

// 4. Currency
// Supports $, €, £, ¥, ₩, etc. (Rates are static for demo)
Hotel = $200
Food = €50
Total Trip Cost = Hotel + Food in USD

// 5. References
// You can refer to line numbers (line1, line2) or 'prev'
Item A = 100
Item B = 200
prev * 2

// Try typing your own calculations below!
`;

export const useSheetStore = create<SheetState>()(
  persist(
    (set, get) => ({
      sheets: [
        {
          id: 'welcome',
          name: 'Welcome',
          content: WELCOME_CONTENT,
          lastModified: Date.now(),
        },
      ],
      activeSheetId: 'welcome',
      history: {}, 
      theme: 'dark',

      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      addSheet: () => {
        const newId = uuidv4();
        set((state) => ({
          sheets: [
            ...state.sheets,
            {
              id: newId,
              name: 'New Sheet',
              content: '',
              lastModified: Date.now(),
            },
          ],
          activeSheetId: newId,
        }));
      },

      addWelcomeSheet: () => {
        const newId = uuidv4();
        set((state) => ({
          sheets: [
            ...state.sheets,
            {
              id: newId,
              name: 'Welcome',
              content: WELCOME_CONTENT,
              lastModified: Date.now(),
            },
          ],
          activeSheetId: newId,
        }));
      },

      deleteSheet: (id) => {
        set((state) => {
          if (state.sheets.length <= 1) return state;
          
          const newSheets = state.sheets.filter((s) => s.id !== id);
          const newActiveId =
            state.activeSheetId === id ? newSheets[0].id : state.activeSheetId;
            
          // Clear history for deleted sheet
          const newHistory = { ...state.history };
          delete newHistory[id];

          return {
            sheets: newSheets,
            activeSheetId: newActiveId,
            history: newHistory
          };
        });
      },

      setActiveSheet: (id) => set({ activeSheetId: id }),

      updateSheetName: (id, name) =>
        set((state) => ({
          sheets: state.sheets.map((s) =>
            s.id === id ? { ...s, name, lastModified: Date.now() } : s
          ),
        })),

      updateSheetContent: (id, content) =>
        set((state) => {
          const currentSheet = state.sheets.find(s => s.id === id);
          if (!currentSheet) return state;

          // Push current content to past
          const sheetHistory = state.history[id] || { past: [], future: [] };
          
          // Limit history size (e.g. 50)
          const newPast = [...sheetHistory.past, currentSheet.content].slice(-50);

          return {
            sheets: state.sheets.map((s) =>
              s.id === id ? { ...s, content, lastModified: Date.now() } : s
            ),
            history: {
                ...state.history,
                [id]: {
                    past: newPast,
                    future: [] // Clear future on new change
                }
            }
          };
        }),
        
      undo: () => set((state) => {
          const id = state.activeSheetId;
          const sheetHistory = state.history[id];
          if (!sheetHistory || sheetHistory.past.length === 0) return state;

          const previousContent = sheetHistory.past[sheetHistory.past.length - 1];
          const newPast = sheetHistory.past.slice(0, -1);
          
          const currentSheet = state.sheets.find(s => s.id === id);
          if (!currentSheet) return state;

          const newFuture = [currentSheet.content, ...sheetHistory.future];

          return {
              sheets: state.sheets.map(s => s.id === id ? { ...s, content: previousContent, lastModified: Date.now() } : s),
              history: {
                  ...state.history,
                  [id]: {
                      past: newPast,
                      future: newFuture
                  }
              }
          };
      }),

      redo: () => set((state) => {
          const id = state.activeSheetId;
          const sheetHistory = state.history[id];
          if (!sheetHistory || sheetHistory.future.length === 0) return state;

          const nextContent = sheetHistory.future[0];
          const newFuture = sheetHistory.future.slice(1);
          
          const currentSheet = state.sheets.find(s => s.id === id);
          if (!currentSheet) return state;

          const newPast = [...sheetHistory.past, currentSheet.content];

          return {
              sheets: state.sheets.map(s => s.id === id ? { ...s, content: nextContent, lastModified: Date.now() } : s),
              history: {
                  ...state.history,
                  [id]: {
                      past: newPast,
                      future: newFuture
                  }
              }
          };
      }),
        
      importSheets: (newSheets) => {
          if (!Array.isArray(newSheets) || newSheets.length === 0) return;
          const migratedSheets = newSheets.map(s => {
             if ((s as any).lines && Array.isArray((s as any).lines)) {
                 return {
                     ...s,
                     content: ((s as any).lines as string[]).join('\n'),
                     lines: undefined
                 } as Sheet;
             }
             return s;
          });
          
          set({
              sheets: migratedSheets,
              activeSheetId: migratedSheets[0].id,
              history: {} 
          })
      }
    }),
    {
      name: 'sumflow-storage',
      onRehydrateStorage: () => (state) => {
          if (state) {
              state.sheets = state.sheets.map(s => {
                  if ((s as any).lines && Array.isArray((s as any).lines)) {
                      return {
                          ...s,
                          content: ((s as any).lines as string[]).join('\n'),
                          lines: undefined 
                      } as unknown as Sheet;
                  }
                  return s;
              });
          }
      }
    }
  )
);
