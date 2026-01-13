import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';

interface FlashMessages {
  success?: string;
  error?: string;
  warning?: string;
  info?: string;
}

export function useToast() {
  const { props } = usePage<{ flash?: FlashMessages }>();

  useEffect(() => {
    toast.dismiss();

    const flash = props.flash as FlashMessages | undefined;

    if (flash?.success) {
      toast.success(flash.success, {
        duration: 3000,
        position: 'top-right',
      });
    }

    if (flash?.error) {
      toast.error(flash.error, {
        duration: 3000,
        position: 'top-right',
      });
    }

    if (flash?.warning) {
      toast.warning(flash.warning, {
        duration: 3000,
        position: 'top-right',
      });
    }

    if (flash?.info) {
      toast.info(flash.info, {
        duration: 3000,
        position: 'top-right',
      });
    }
  }, [props.flash]);
}