import { create } from 'zustand';

type DialogOptions = {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isConfirm?: boolean;
};

interface DialogStore {
  isOpen: boolean;
  options: DialogOptions;
  open: (opts: DialogOptions) => void;
  close: () => void;
}

export const useDialogStore = create<DialogStore>((set) => ({
  isOpen: false,
  options: { message: '' },
  open: (opts) => set({ isOpen: true, options: opts }),
  close: () => set({ isOpen: false }),
}));

export const Dialogs = {
  alert: (message: string, title: string = 'Aviso', type: DialogOptions['type'] = 'info') => {
    useDialogStore.getState().open({ message, title, type, isConfirm: false });
  },
  confirm: (message: string, title: string = 'Confirmação', onConfirm: () => void) => {
    useDialogStore.getState().open({
      message,
      title,
      type: 'warning',
      isConfirm: true,
      onConfirm,
    });
  }
};
