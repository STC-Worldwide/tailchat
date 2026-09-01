import Cropper, { Area } from 'react-easy-crop';
import _isNil from 'lodash/isNil';
import { showToasts, t } from 'tailchat-shared';
import React, { useState } from 'react';
import { ModalWrapper } from '../Modal';
import { Button } from '@/components/ui/official/button';
import { LoaderCircleIcon } from 'lucide-react';

/**
 * 头像裁剪模态框
 */
export const ImageCropperModal: React.FC<{
  imageUrl: string;
  aspect?: number;
  onConfirm: (croppedImageBlobUrl: string) => void;
}> = React.memo((props) => {
  const aspect = props.aspect ?? 1;
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area>({ width: 0, height: 0, x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const blobUrl = await getCroppedImg(
        await createImage(props.imageUrl),
        area
      );
      props.onConfirm(blobUrl);
    } catch (error) {
      console.error(error);
      showToasts(t('无法裁剪图片，请重试'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ModalWrapper
      title={t('裁剪图片')}
      className="flex h-[min(78dvh,48rem)] w-[min(92vw,64rem)] max-w-full flex-col gap-4 p-4 sm:p-6 [&_[data-slot=dialog-title]]:mb-0 [&_[data-slot=dialog-title]]:text-left"
    >
      <div
        className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-black/80 ring-1 ring-inset ring-white/10"
        role="region"
        aria-label={t('图片裁剪区域')}
      >
        <Cropper
          image={props.imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, area) => setArea(area)}
        />
      </div>

      <footer className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="min-w-0 flex-1 sm:max-w-sm">
          <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-foreground">
            <span>{t('缩放')}</span>
            <span className="tabular-nums text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
          </span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            aria-label={t('图片缩放')}
            className="h-2 w-full cursor-pointer accent-primary"
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>

        <Button
          className="sm:min-w-32"
          disabled={isProcessing || area.width === 0 || area.height === 0}
          aria-busy={isProcessing}
          onClick={handleConfirm}
        >
          {isProcessing && (
            <LoaderCircleIcon
              data-icon="inline-start"
              className="size-4 animate-spin"
            />
          )}
          {isProcessing ? t('处理中') : t('应用裁剪')}
        </Button>
      </footer>
    </ModalWrapper>
  );
});
ImageCropperModal.displayName = 'ImageCropperModal';

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

let fileUrlTemp: string | null = null; // 缓存裁剪后的图片url
/**
 * 根据裁剪信息裁剪原始图片
 * 生成一个临时的资源文件路径
 * @param image 原始图片元素
 * @param crop 裁剪信息
 * @param rotation 旋转角度
 * @param fileName 文件名
 * @returns 裁剪后的图片blob url
 */
function getCroppedImg(
  image: HTMLImageElement,
  crop: Area,
  rotation = 0,
  fileName = 'newFile.jpeg'
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (_isNil(ctx)) {
    return Promise.reject(new Error('Canvas is unavailable'));
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // set each dimensions to double largest dimension to allow for a safe area for the
  // image to rotate in without being clipped by canvas context
  canvas.width = safeArea;
  canvas.height = safeArea;

  // translate canvas context to a central location on image to allow rotating around the center.
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // draw rotated image and store data.
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );
  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = crop.width;
  canvas.height = crop.height;

  // paste generated rotate image with correct offsets for x,y crop values.
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - crop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - crop.y)
  );

  return new Promise<string>((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        (blob as any).name = fileName;
        if (typeof fileUrlTemp === 'string') {
          window.URL.revokeObjectURL(fileUrlTemp);
        }
        fileUrlTemp = window.URL.createObjectURL(blob);
        resolve(fileUrlTemp);
      }, 'image/jpeg');
    } catch (err) {
      reject(err);
    }
  });
}
