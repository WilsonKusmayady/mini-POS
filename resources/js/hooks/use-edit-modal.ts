// Di file: hooks/use-edit-modal.ts
import { useState, useCallback } from 'react';
import { FormSchema } from '@/types/form-schema';
import { ModalWidth } from '@/components/ui/edit-modal'; // Import tipe ModalWidth

interface UseEditModalProps<T extends Record<string, any>> {
  initialData?: T | null;
  initialSchema?: FormSchema<T> | null;
  initialTitle?: string;
  initialWidth?: ModalWidth; // Tambahkan initialWidth
}

export function useEditModal<T extends Record<string, any>>({
  initialData = null,
  initialSchema = null,
  initialTitle = '',
  initialWidth = 'md', // Default width
}: UseEditModalProps<T> = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editData, setEditData] = useState<T | null>(initialData);
  const [schema, setSchema] = useState<FormSchema<T> | null>(initialSchema);
  const [modalTitle, setModalTitle] = useState(initialTitle);
  const [modalWidth, setModalWidth] = useState<ModalWidth>(initialWidth); // State untuk width

  const openModal = useCallback((
    data: T, 
    schema: FormSchema<T>, 
    title: string,
    width?: ModalWidth // Tambahkan parameter width
  ) => {
    setEditData(data);
    setSchema(schema);
    setModalTitle(title);
    if (width) {
      setModalWidth(width);
    }
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setEditData(null);
    setSchema(null);
    setModalTitle('');
    setModalWidth(initialWidth); // Reset ke initial width
  }, [initialWidth]);

  return {
    isOpen,
    openModal,
    closeModal,
    editData,
    schema,
    modalTitle,
    modalWidth,
  };
}