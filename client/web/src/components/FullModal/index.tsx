import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import _isFunction from 'lodash/isFunction';
import clsx from 'clsx';
import { Button } from '@/components/ui/official/button';
import { XIcon } from 'lucide-react';
import { t } from 'tailchat-shared';
import { useModalContext } from '@/components/Modal';

/**
 * 全屏模态框
 */
interface FullModalProps extends PropsWithChildren {
  visible?: boolean;
  onChangeVisible?: (visible: boolean) => void;
}
export const FullModal: React.FC<FullModalProps> = React.memo((props) => {
  const { visible = true, onChangeVisible } = props;
  const { insideModal } = useModalContext();
  const ref = useRef<HTMLDivElement | null>(null);

  const handleClose = useCallback(() => {
    _isFunction(onChangeVisible) && onChangeVisible(false);
  }, [onChangeVisible]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keyup', handler);

    return () => {
      window.removeEventListener('keyup', handler);
    };
  }, [handleClose]);

  return (
    <div
      className={clsx(
        'flex items-stretch justify-center overflow-hidden bg-background text-foreground',
        insideModal
          ? 'relative h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] sm:h-[min(80vh,52rem)] sm:w-[min(80vw,72rem)]'
          : 'fixed inset-0 z-10 h-screen w-screen',
        {
          'opacity-0': !visible,
        }
      )}
      ref={ref}
    >
      {props.children}

      {_isFunction(onChangeVisible) && (
        <div
          className="absolute top-3 right-3 z-20 flex flex-col items-center gap-0.5"
          data-testid="full-modal-close"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="border border-border bg-background/95 shadow-sm backdrop-blur-sm"
            aria-label={t('关闭')}
            onClick={handleClose}
          >
            <XIcon />
          </Button>
          <span className="text-[10px] font-medium text-muted-foreground max-md:hidden">
            ESC
          </span>
        </div>
      )}
    </div>
  );
});
FullModal.displayName = 'FullModal';
