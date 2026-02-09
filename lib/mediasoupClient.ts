// Client-side helper for MediaSoup signaling and transport setup
// Requires: npm install mediasoup-client

// @ts-ignore
import { Device } from 'mediasoup-client';

export async function createDevice() {
  const device = new Device();
  return device;
}

export async function initDevice(device: any, routerRtpCapabilities: any) {
  if (!device.loaded) {
    await device.load({ routerRtpCapabilities });
  }
}

export default { createDevice, initDevice };
