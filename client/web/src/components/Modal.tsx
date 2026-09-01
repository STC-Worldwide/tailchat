import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import _isFunction from 'lodash/isFunction';
import _isNil from 'lodash/isNil';
import _last from 'lodash/last';
import _pull from 'lodash/pull';
import _isString from 'lodash/isString';
import _noop from 'lodash/noop';
import { PortalAdd, PortalRemove } from './Portal';
import clsx from 'clsx';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ErrorBoundary } from './ErrorBoundary';
import { t } from 'tailchat-shared';
import { Button } from '@/components/ui/official/button';
import { XIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/official/dialog';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';

/**
 * 模态框
 */

const ModalContext = React.createContext<{
  closeModal: () => void;
  insideModal: boolean;
}>({
  closeModal: _noop,
  insideModal: false,
});

interface ModalProps extends PropsWithChildren {
  visible?: boolean;
  onChangeVisible?: (visible: boolean) => void;

  /**
   * 是否显示右上角的关闭按钮
   * @default false
   */
  closable?: boolean;

  /**
   * 遮罩层是否可关闭
   */
  maskClosable?: boolean;
}
export const Modal: React.FC<ModalProps> = React.memo((props) => {
  const {
    visible,
    onChangeVisible,
    closable = false,
    maskClosable = true,
  } = props;
  const [showing, setShowing] = useState(true);
  const portalContainer = useAppPortalContainer();

  const closeModal = useCallback(() => {
    setShowing(false);
  }, []);

  const handleClose = useCallback(() => {
    if (maskClosable === false) {
      return;
    }

    closeModal();
  }, [maskClosable, closeModal]);

  useEffect(() => {
    if (showing || !_isFunction(onChangeVisible)) {
      return;
    }

    const timer = window.setTimeout(() => onChangeVisible(false), 150);
    return () => window.clearTimeout(timer);
  }, [onChangeVisible, showing]);

  if (visible === false) {
    return null;
  }

  return (
    <Dialog open={showing} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        portalContainer={portalContainer}
        overlayClassName="bg-black/60 supports-backdrop-filter:backdrop-blur-none"
        showCloseButton={false}
        className="max-h-[calc(100dvh-1rem)] w-auto max-w-[calc(100vw-1rem)] overflow-y-auto overflow-x-hidden p-0 sm:max-h-[80vh] sm:max-w-[80vw]"
        data-tc-role="modal"
      >
        <ModalContext.Provider value={{ closeModal, insideModal: true }}>
          <ErrorBoundary>{props.children}</ErrorBoundary>

          {closable === true && (
            <Button
              variant="ghost"
              size="icon-lg"
              className="absolute right-2 top-2 z-10"
              aria-label={t('关闭')}
              onClick={closeModal}
            >
              <XIcon className="size-4" />
            </Button>
          )}
        </ModalContext.Provider>
      </DialogContent>
    </Dialog>
  );
});
Modal.displayName = 'Modal';

const modelKeyStack: number[] = [];

/**
 * 关闭Modal
 */
export function closeModal(key?: number): void {
  if (_isNil(key)) {
    key = _last(modelKeyStack);
  }

  if (typeof key === 'number') {
    _pull(modelKeyStack, key);

    PortalRemove(key);
  }
}

/**
 * 打开新的Modal
 */
export function openModal(
  content: React.ReactNode,
  props?: Pick<ModalProps, 'closable' | 'maskClosable'> & {
    onCloseModal?: () => void | Promise<void>;
  }
): number {
  const key = PortalAdd(
    <Modal
      {...props}
      visible={true}
      onChangeVisible={async (visible) => {
        if (visible === false) {
          if (typeof props?.onCloseModal === 'function') {
            await props.onCloseModal();
          }

          closeModal(key);
        }
      }}
    >
      {content}
    </Modal>
  );

  modelKeyStack.push(key);

  return key;
}

interface OpenConfirmModalProps {
  onConfirm: () => void;
  onCancel?: () => void;
  title?: string;
  content?: string;
}
export function openConfirmModal(props: OpenConfirmModalProps) {
  const key = openModal(
    <ModalWrapper title={props.title ?? t('确认操作')}>
      <h3 className="text-center pb-6">{props.content}</h3>
      <div className="space-x-2 text-right">
        <Button
          variant="secondary"
          onClick={() => {
            props.onCancel?.();
            closeModal(key);
          }}
        >
          {t('取消')}
        </Button>
        <Button
          onClick={() => {
            props.onConfirm();
            closeModal(key);
          }}
        >
          {t('确认')}
        </Button>
      </div>
    </ModalWrapper>,
    {
      onCloseModal: props.onCancel,
    }
  );
}

type OpenReconfirmModalProps = Pick<
  OpenConfirmModalProps,
  'title' | 'content' | 'onConfirm' | 'onCancel'
>;
/**
 * 打开再次确认操作modal
 */
export function openReconfirmModal(props: OpenReconfirmModalProps) {
  openConfirmModal({
    onConfirm: props.onConfirm,
    onCancel: props.onCancel,
    title: props.title ?? t('确认要进行该操作么?'),
    content: props.content ?? t('该操作无法被撤回'),
  });
}
/**
 * 打开再次确认操作modal(Promise版本)
 * @example
 * if(await openReconfirmModalP()) {
 *   // do somthing
 * }
 */
export function openReconfirmModalP(
  props?: Omit<OpenReconfirmModalProps, 'onConfirm' | 'onCancel'>
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    openReconfirmModal({
      ...props,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}

/**
 * 获取modal上下文
 */
export function useModalContext() {
  const { closeModal, insideModal } = useContext(ModalContext);

  return { closeModal, insideModal };
}

/**
 * 标准模态框包装器
 */
export const ModalWrapper: React.FC<
  PropsWithChildren<{
    title?: string;
    className?: string;
    style?: React.CSSProperties;
  }>
> = React.memo((props) => {
  const isMobile = useIsMobile();

  const title = _isString(props.title) ? (
    <DialogHeader className="mb-4 pr-10 text-left">
      <DialogTitle className="text-lg leading-6 font-semibold">
        {props.title}
      </DialogTitle>
    </DialogHeader>
  ) : null;

  return (
    <div
      className={clsx('tc-modal', 'p-4', props.className)}
      style={{ minWidth: isMobile ? 290 : 420, ...props.style }}
    >
      {title}
      {props.children}
    </div>
  );
});
ModalWrapper.displayName = 'ModalWrapper';
