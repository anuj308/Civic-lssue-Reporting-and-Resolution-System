import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface UIState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  theme: 'light' | 'dark';
  notifications: {
    show: boolean;
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  };
  loading: {
    global: boolean;
    components: Record<string, boolean>;
  };
  modals: {
    [key: string]: {
      open: boolean;
      data?: any;
    };
  };
  breadcrumbs: Array<{
    label: string;
    path?: string;
  }>;
  pageTitle: string;
  filters: {
    collapsed: boolean;
  };
  tables: {
    [key: string]: {
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
      selectedRows: string[];
      density: 'compact' | 'standard' | 'comfortable';
    };
  };
  preferences: {
    autoRefresh: boolean;
    refreshInterval: number; // in minutes
    defaultPageSize: number;
    dateFormat: string;
    timezone: string;
  };
}

// Initial state
const initialState: UIState = {
  sidebarOpen: true,
  sidebarWidth: 280,
  theme: 'light',
  notifications: {
    show: true,
    position: 'top-right',
  },
  loading: {
    global: false,
    components: {},
  },
  modals: {},
  breadcrumbs: [],
  pageTitle: '',
  filters: {
    collapsed: false,
  },
  tables: {},
  preferences: {
    autoRefresh: false,
    refreshInterval: 5,
    defaultPageSize: 10,
    dateFormat: 'MM/dd/yyyy',
    timezone: 'UTC',
  },
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.sidebarWidth = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    setComponentLoading: (state, action: PayloadAction<{ component: string; loading: boolean }>) => {
      state.loading.components[action.payload.component] = action.payload.loading;
    },
    clearComponentLoading: (state, action: PayloadAction<string>) => {
      delete state.loading.components[action.payload];
    },
    openModal: (state, action: PayloadAction<{ modal: string; data?: any }>) => {
      state.modals[action.payload.modal] = {
        open: true,
        data: action.payload.data,
      };
    },
    closeModal: (state, action: PayloadAction<string>) => {
      if (state.modals[action.payload]) {
        state.modals[action.payload].open = false;
        delete state.modals[action.payload].data;
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modal => {
        state.modals[modal].open = false;
        delete state.modals[modal].data;
      });
    },
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path?: string }>>) => {
      state.breadcrumbs = action.payload;
    },
    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload;
    },
    toggleFilters: (state) => {
      state.filters.collapsed = !state.filters.collapsed;
    },
    setFiltersCollapsed: (state, action: PayloadAction<boolean>) => {
      state.filters.collapsed = action.payload;
    },
    setTableConfig: (state, action: PayloadAction<{
      table: string;
      config: Partial<UIState['tables'][string]>;
    }>) => {
      const { table, config } = action.payload;
      if (!state.tables[table]) {
        state.tables[table] = {
          selectedRows: [],
          density: 'standard',
        };
      }
      state.tables[table] = { ...state.tables[table], ...config };
    },
    toggleTableRow: (state, action: PayloadAction<{ table: string; rowId: string }>) => {
      const { table, rowId } = action.payload;
      if (!state.tables[table]) {
        state.tables[table] = {
          selectedRows: [],
          density: 'standard',
        };
      }

      const selectedRows = state.tables[table].selectedRows;
      const index = selectedRows.indexOf(rowId);

      if (index === -1) {
        selectedRows.push(rowId);
      } else {
        selectedRows.splice(index, 1);
      }
    },
    selectAllTableRows: (state, action: PayloadAction<{ table: string; rowIds: string[] }>) => {
      const { table, rowIds } = action.payload;
      if (!state.tables[table]) {
        state.tables[table] = {
          selectedRows: [],
          density: 'standard',
        };
      }
      state.tables[table].selectedRows = [...rowIds];
    },
    clearTableSelection: (state, action: PayloadAction<string>) => {
      if (state.tables[action.payload]) {
        state.tables[action.payload].selectedRows = [];
      }
    },
    setNotificationSettings: (state, action: PayloadAction<Partial<UIState['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updatePreferences: (state, action: PayloadAction<Partial<UIState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setSidebarWidth,
  setTheme,
  setGlobalLoading,
  setComponentLoading,
  clearComponentLoading,
  openModal,
  closeModal,
  closeAllModals,
  setBreadcrumbs,
  setPageTitle,
  toggleFilters,
  setFiltersCollapsed,
  setTableConfig,
  toggleTableRow,
  selectAllTableRows,
  clearTableSelection,
  setNotificationSettings,
  updatePreferences,
} = uiSlice.actions;

// Selectors
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectSidebarWidth = (state: { ui: UIState }) => state.ui.sidebarWidth;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.loading.global;
export const selectComponentLoading = (component: string) => (state: { ui: UIState }) =>
  state.ui.loading.components[component] || false;
export const selectModal = (modal: string) => (state: { ui: UIState }) =>
  state.ui.modals[modal] || { open: false };
export const selectBreadcrumbs = (state: { ui: UIState }) => state.ui.breadcrumbs;
export const selectPageTitle = (state: { ui: UIState }) => state.ui.pageTitle;
export const selectFiltersCollapsed = (state: { ui: UIState }) => state.ui.filters.collapsed;
export const selectTableConfig = (table: string) => (state: { ui: UIState }) =>
  state.ui.tables[table] || { selectedRows: [], density: 'standard' };
export const selectNotificationSettings = (state: { ui: UIState }) => state.ui.notifications;
export const selectPreferences = (state: { ui: UIState }) => state.ui.preferences;

export default uiSlice.reducer;
