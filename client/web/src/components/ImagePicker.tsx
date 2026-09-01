import React, { PropsWithChildren, useRef } from 'react';
import { closeModal, openModal } from './Modal';
import { showToasts, t, useEvent } from 'tailchat-shared';
import { ImageCropperModal } from './modals/ImageCropper';
import { isGIF } from '@/utils/file-helper';
import clsx from 'clsx';
import { CameraIcon } from 'lucide-react';

interface ImagePickerProps extends PropsWithChildren {
  className?: string;
  imageUrl?: string; // 初始image url, 仅children为空时生效
  aspect?: number;
  onChange?: (blobUrl: string) => void;
  disabled?: boolean; // 禁用选择
}
/**
 * 头像选择器
 */
export const ImagePicker: React.FC<ImagePickerProps> = React.memo((props) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const updateAvatar = (imageBlobUrl: string) => {
    if (typeof props.onChange === 'function') {
      props.onChange(imageBlobUrl);
    }
  };

  const handleSelectFile = useEvent(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const pickedFile = e.target.files[0];
        if (!pickedFile) {
          return;
        }

        if (isGIF(pickedFile)) {
          updateAvatar(URL.createObjectURL(pickedFile));
        } else {
          const reader = new FileReader();
          reader.addEventListener('load', () => {
            if (reader.result) {
              const key = openModal(
                <ImageCropperModal
                  imageUrl={reader.result.toString()}
                  aspect={props.aspect}
                  onConfirm={(croppedImageBlobUrl) => {
                    closeModal(key);
                    updateAvatar(croppedImageBlobUrl);
                  }}
                />,
                {
                  maskClosable: false,
                  closable: true,
                }
              );
            } else {
              showToasts(t('文件读取失败'), 'error');
            }
          });
          reader.readAsDataURL(pickedFile);
        }

        // 清理选中状态
        e.target.files = null;
        e.target.value = '';
      }
    }
  );

  return (
    <div className={clsx('relative inline-grid', props.className)}>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        tabIndex={-1}
        onChange={handleSelectFile}
        accept="image/*"
      />

      <button
        type="button"
        className="group relative inline-grid overflow-hidden rounded-[inherit] outline-none ring-ring transition focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={props.disabled}
        aria-label={t('选择图片')}
        onClick={() => fileRef.current?.click()}
      >
        {props.children}

        <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <CameraIcon aria-hidden="true" className="size-8 text-white" />
        </span>
      </button>
    </div>
  );
});
ImagePicker.displayName = 'ImagePicker';
