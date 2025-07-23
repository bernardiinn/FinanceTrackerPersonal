// Simple device fingerprinting utility
export const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx!.textBaseline = 'top';
  ctx!.font = '14px Arial';
  ctx!.fillText('Device fingerprint', 2, 2);
  
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
    canvas.toDataURL(),
    navigator.hardwareConcurrency?.toString() || '0',
    navigator.maxTouchPoints?.toString() || '0',
  ];
  
  // Simple hash function
  const hash = components.join('|');
  let hashCode = 0;
  for (let i = 0; i < hash.length; i++) {
    const char = hash.charCodeAt(i);
    hashCode = ((hashCode << 5) - hashCode) + char;
    hashCode = hashCode & hashCode; // Convert to 32-bit integer
  }
  
  return Math.abs(hashCode).toString(16);
};

export const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  
  // Mobile devices
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android Device';
  
  // Desktop browsers
  if (/Chrome/.test(ua)) return 'Chrome Browser';
  if (/Firefox/.test(ua)) return 'Firefox Browser';
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari Browser';
  if (/Edge/.test(ua)) return 'Edge Browser';
  
  return 'Unknown Device';
};

export const isDeviceTrusted = (): boolean => {
  return localStorage.getItem('deviceTrusted') === 'true';
};

export const setDeviceTrusted = (trusted: boolean): void => {
  if (trusted) {
    localStorage.setItem('deviceTrusted', 'true');
    localStorage.setItem('deviceFingerprint', generateDeviceFingerprint());
  } else {
    localStorage.removeItem('deviceTrusted');
    localStorage.removeItem('deviceFingerprint');
  }
};

export const getStoredDeviceFingerprint = (): string | null => {
  return localStorage.getItem('deviceFingerprint');
};
