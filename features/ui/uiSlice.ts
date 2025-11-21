import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ToastMessage, ToastType } from '../../core/types/common';

interface ModalState {
    type: 'deleteConfirm' | 'settings' | 'help' | 'commandPalette' | null;
    props: Record<string, any>;
    isOpen: boolean;
}

interface UiState {
    toasts: (ToastMessage & { duration?: number })[];
    modal: ModalState;
    isSidebarOpen: boolean;
    activeLeftSidebarView: 'notes' | 'tasks' | 'templates';
    activeRightSidebarView: 'ai' | 'graph' | 'history';
}

const initialState: UiState = {
    toasts: [],
    modal: { type: null, props: {}, isOpen: false },
    isSidebarOpen: false,
    activeLeftSidebarView: 'notes',
    activeRightSidebarView: 'ai',
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        addToast: (state, action: PayloadAction<{ message: string; type: ToastType; duration?: number }>) => {
            const id = Date.now();
            state.toasts.push({ 
                id, 
                message: action.payload.message, 
                type: action.payload.type, 
                duration: action.payload.duration 
            });
        },
        removeToast: (state, action: PayloadAction<number>) => {
            state.toasts = state.toasts.filter(t => t.id !== action.payload);
        },
        openModal: (state, action: PayloadAction<{ type: ModalState['type']; props?: Record<string, any> }>) => {
            state.modal.type = action.payload.type;
            state.modal.props = action.payload.props || {};
            state.modal.isOpen = true;
        },
        closeModal: (state) => {
            state.modal.isOpen = false;
        },
        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.isSidebarOpen = action.payload;
        },
        setLeftSidebarView: (state, action: PayloadAction<UiState['activeLeftSidebarView']>) => {
            state.activeLeftSidebarView = action.payload;
        },
        setRightSidebarView: (state, action: PayloadAction<UiState['activeRightSidebarView']>) => {
            state.activeRightSidebarView = action.payload;
        }
    },
});

export const { addToast, removeToast, openModal, closeModal, setSidebarOpen, setLeftSidebarView, setRightSidebarView } = uiSlice.actions;
export default uiSlice.reducer;