
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import SettingsModal from '../components/SettingsModal';
import HelpCenter from '../components/HelpCenter';
import CommandPalette from '../components/CommandPalette'; // Import CommandPalette
import { NoteProvider } from './NoteContext'; // Import NoteProvider

type ModalType = 'deleteConfirm' | 'settings' | 'help' | 'commandPalette';

interface ModalState {
  type: ModalType | null;
  props: any;
}

interface ModalContextType {
  showModal: (type: ModalType, props?: any) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

const MODAL_COMPONENTS: { [key in ModalType]: React.FC<any> } = {
  deleteConfirm: ConfirmDeleteModal,
  settings: SettingsModal,
  help: HelpCenter,
  commandPalette: CommandPalette,
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalState>({ type: null, props: {} });
  const [isOpen, setIsOpen] = useState(false);

  const showModal = useCallback((type: ModalType, props: any = {}) => {
    setModalState({ type, props });
    setIsOpen(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsOpen(false); // This triggers the exit animation in the modal components
    setTimeout(() => {
        setModalState({ type: null, props: {} }); // After animation, clear modal type to unmount
    }, 200); // Should match animation duration
  }, []);

  const renderModal = () => {
    if (!modalState.type) {
      return null;
    }
    const ModalComponent = MODAL_COMPONENTS[modalState.type];
    // We now control the visibility with the local isOpen state
    return <ModalComponent isOpen={isOpen} {...modalState.props} />;
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
        {children}
        {renderModal()}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};