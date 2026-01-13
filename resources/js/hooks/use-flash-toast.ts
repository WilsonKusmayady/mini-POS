import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';

interface FlashMessages {
  success?: string;
  error?: string;
  warning?: string;
  info?: string;
}

export function useFlashToast() {
  const { flash } = usePage<{ flash?: FlashMessages }>().props;
  const shownRef = useRef(false);


  useEffect(() => {
    if (!flash || shownRef.current) return;

    shownRef.current = true;

    if (flash.success) toast.success(flash.success);
    if (flash.error) toast.error(flash.error);
    if (flash.warning) toast.warning(flash.warning);
    if (flash.info) toast.info(flash.info);

  }, [flash]);
}
