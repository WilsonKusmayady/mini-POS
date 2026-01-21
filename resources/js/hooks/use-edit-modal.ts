// hooks/use-edit-modal.ts
import { useState, useCallback } from 'react';
import { FormSchema } from '@/types/form-schema';

interface UseEditModalReturn<T> {
  isOpen: boolean;
  openModal: (data?: T, schema?: FormSchema<T>, title?: string) => void;
  closeModal: () => void;
  editData: T | null;
  schema: FormSchema<T> | null;
  modalTitle: string;
}

export function useEditModal<T extends Record<string, any>>(): UseEditModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [editData, setEditData] = useState<T | null>(null);
  const [schema, setSchema] = useState<FormSchema<T> | null>(null);
  const [modalTitle, setModalTitle] = useState('Edit Data');

  const openModal = useCallback((data?: T, schema?: FormSchema<T>, title?: string) => {
    if (data) {
      setEditData(data);
    }
    if (schema) {
      setSchema(schema);
    }
    if (title) {
      setModalTitle(title);
    }
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setEditData(null);
    setSchema(null);
    setModalTitle('Edit Data');
  }, []);

  return {
    isOpen,
    openModal,
    closeModal,
    editData,
    schema,
    modalTitle,
  };
}