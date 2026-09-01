import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { ImagePicker } from '../ImagePicker';
import { ImageUploadPreviewer } from '../modals/ImageUploadPreviewer';
import { ImageCropperModal } from '../modals/ImageCropper';
import { Modal } from '../Modal';

jest.mock('react-easy-crop', () => ({
  __esModule: true,
  default: () => null,
}));

describe('modern image workflow', () => {
  test('exposes one named image-picker button and delegates to its file input', () => {
    render(
      <ImagePicker>
        <span>Avatar</span>
      </ImagePicker>
    );

    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeTruthy();
    const clickSpy = jest.spyOn(input as HTMLInputElement, 'click');

    fireEvent.click(screen.getByRole('button', { name: '选择图片' }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  test('renders an accessible Shadcn image-upload decision surface', () => {
    render(
      <div id="tailchat-app">
        <Modal visible={true} maskClosable={false}>
          <ImageUploadPreviewer
            imageUrl="data:image/png;base64,example"
            onCancel={jest.fn()}
            onConfirm={jest.fn().mockResolvedValue(undefined)}
          />
        </Modal>
      </div>
    );

    expect(
      screen.getByRole('heading', { name: '上传图片到会话' })
    ).toBeTruthy();
    expect(screen.getByRole('img', { name: '待上传图片预览' })).toBeTruthy();
    expect(screen.getByRole('switch', { name: '上传原图' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '取消' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '确认上传' })).toBeTruthy();
  });

  test('renders an accessible responsive crop surface', () => {
    render(
      <div id="tailchat-app">
        <Modal visible={true} maskClosable={false}>
          <ImageCropperModal
            imageUrl="data:image/png;base64,example"
            onConfirm={jest.fn()}
          />
        </Modal>
      </div>
    );

    expect(screen.getByRole('heading', { name: '裁剪图片' })).toBeTruthy();
    expect(screen.getByRole('region', { name: '图片裁剪区域' })).toBeTruthy();
    expect(screen.getByRole('slider', { name: '图片缩放' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '应用裁剪' })).toBeTruthy();
  });
});
