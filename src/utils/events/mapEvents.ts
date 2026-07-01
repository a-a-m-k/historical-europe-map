import { createChannel, createVoidChannel, type SubscribeOptions } from "./eventBus";

export type MapCameraResetStateDetail = {
  isAtResetCamera: boolean;
};

export type MapScreenshotCaptureStateDetail = {
  isCapturing: boolean;
};

const resetCameraChannel = createVoidChannel();
const cameraResetStateChannel = createChannel<MapCameraResetStateDetail>();
const screenshotCaptureStateChannel =
  createChannel<MapScreenshotCaptureStateDetail>();
const screenshotLegendExpandChannel = createVoidChannel();
const screenshotLegendRestoreChannel = createVoidChannel();

export const dispatchMapResetCamera = () => {
  resetCameraChannel.dispatch();
};

export const onMapResetCamera = (
  listener: () => void,
  options?: SubscribeOptions
) => resetCameraChannel.subscribe(listener, options);

export const dispatchMapCameraResetState = (
  detail: MapCameraResetStateDetail
) => {
  cameraResetStateChannel.dispatch(detail);
};

export const onMapCameraResetState = (
  listener: (detail: MapCameraResetStateDetail) => void,
  options?: SubscribeOptions
) => cameraResetStateChannel.subscribe(listener, options);

export const dispatchMapScreenshotCaptureState = (
  detail: MapScreenshotCaptureStateDetail
) => {
  screenshotCaptureStateChannel.dispatch(detail);
};

export const onMapScreenshotCaptureState = (
  listener: (detail: MapScreenshotCaptureStateDetail) => void,
  options?: SubscribeOptions
) => screenshotCaptureStateChannel.subscribe(listener, options);

export const dispatchMapScreenshotLegendExpand = () => {
  screenshotLegendExpandChannel.dispatch();
};

export const onMapScreenshotLegendExpand = (
  listener: () => void,
  options?: SubscribeOptions
) => screenshotLegendExpandChannel.subscribe(listener, options);

export const dispatchMapScreenshotLegendRestore = () => {
  screenshotLegendRestoreChannel.dispatch();
};

export const onMapScreenshotLegendRestore = (
  listener: () => void,
  options?: SubscribeOptions
) => screenshotLegendRestoreChannel.subscribe(listener, options);
