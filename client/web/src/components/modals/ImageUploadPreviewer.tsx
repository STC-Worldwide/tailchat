import React, { useCallback, useState } from 'react';
import { showToasts, t, useAsyncFn } from 'tailchat-shared';
import { useGlobalKeyDown } from '../../hooks/useGlobalKeyDown';
import { isEnterHotkey, isEscHotkey } from '../../utils/hot-key';
import { ModalWrapper } from '@/components/Modal';
import { Button } from '@/components/ui/official/button';
import { Switch } from '@/components/ui/official/switch';
import { ImageIcon, LoaderCircleIcon } from 'lucide-react';

interface ImageSize {
  width: number;
  height: number;
}

interface ImageUploadPreviewerProps {
  imageUrl: string;
  /**
   * 是否强制指定是否上传原图
   *
   * 如果传入undefined则视为用户自行选择
   */
  forceUploadOriginImage?: boolean;
  onConfirm: (imageUploadInfo: {
    size: ImageSize;
    uploadOriginImage: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}
export const ImageUploadPreviewer: React.FC<ImageUploadPreviewerProps> =
  React.memo((props) => {
    const { imageUrl, forceUploadOriginImage } = props;
    const [imageSize, setImageSize] = useState<ImageSize>({
      width: 0,
      height: 0,
    });
    const [uploadOriginImage, setUploadOriginImage] = useState(
      forceUploadOriginImage ?? false
    );

    const [{ loading }, handleConfirm] = useAsyncFn(async () => {
      if (imageSize.width === 0 || imageSize.height === 0) {
        showToasts(t('图片仍在加载，请稍候'), 'warning');
        return;
      }

      if (typeof props.onConfirm === 'function') {
        await Promise.resolve(
          props.onConfirm({
            size: imageSize,
            uploadOriginImage,
          })
        );
      }
    }, [props.onConfirm, imageSize, uploadOriginImage]);

    useGlobalKeyDown(
      (e) => {
        if (isEnterHotkey(e)) {
          e.stopPropagation();
          e.preventDefault();
          handleConfirm();
        } else if (isEscHotkey(e)) {
          e.stopPropagation();
          props.onCancel();
        }
      },
      {
        capture: true,
      }
    );

    const handleLoad = useCallback(
      (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.currentTarget;

        setImageSize({
          width: target.naturalWidth,
          height: target.naturalHeight,
        });
      },
      []
    );

    return (
      <ModalWrapper
        title={t('上传图片到会话')}
        className="w-[min(92vw,56rem)] max-w-full p-4 sm:p-6 [&_[data-slot=dialog-title]]:mb-5 [&_[data-slot=dialog-title]]:text-left"
      >
        <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
          <figure className="relative flex min-h-64 min-w-0 items-center justify-center overflow-hidden rounded-xl bg-black/25 p-3 ring-1 ring-inset ring-white/10">
            <img
              className="mx-auto max-h-[55vh] max-w-full rounded-lg object-contain"
              src={imageUrl}
              alt={t('待上传图片预览')}
              onLoad={handleLoad}
            />
            {imageSize.width > 0 && imageSize.height > 0 && (
              <figcaption className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-xs tabular-nums text-white">
                {imageSize.width} × {imageSize.height}
              </figcaption>
            )}
          </figure>

          <section
            className="flex min-w-0 flex-col justify-between gap-6"
            aria-label={t('图片上传选项')}
          >
            <div className="space-y-5">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <ImageIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>{t('请勿上传违反当地法律法规的图片')}</p>
              </div>

              <div className="flex items-center justify-between gap-4 border-y border-subtle py-4">
                <span className="min-w-0">
                  <span
                    id="upload-origin-image-label"
                    className="block font-medium text-foreground"
                  >
                    {t('上传原图')}
                  </span>
                  <span
                    id="upload-origin-image-help"
                    className="mt-1 block text-xs leading-5 text-muted-foreground"
                  >
                    {typeof forceUploadOriginImage === 'undefined'
                      ? t('保留原始画质，但文件可能更大')
                      : t('此图片格式必须使用原始画质上传')}
                  </span>
                </span>
                <Switch
                  id="upload-origin-image"
                  aria-labelledby="upload-origin-image-label"
                  aria-describedby="upload-origin-image-help"
                  disabled={typeof forceUploadOriginImage !== 'undefined'}
                  checked={uploadOriginImage}
                  onCheckedChange={setUploadOriginImage}
                />
              </div>
            </div>

            <footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={props.onCancel}>
                {t('取消')}
              </Button>
              <Button
                disabled={loading}
                aria-busy={loading}
                onClick={handleConfirm}
              >
                {loading && (
                  <LoaderCircleIcon
                    data-icon="inline-start"
                    className="size-4 animate-spin"
                  />
                )}
                {loading ? t('上传中') : t('确认上传')}
              </Button>
            </footer>
          </section>
        </div>
      </ModalWrapper>
    );
  });
ImageUploadPreviewer.displayName = 'ImageUploadPreviewer';
