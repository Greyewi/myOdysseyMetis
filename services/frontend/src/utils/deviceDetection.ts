export const isMobile = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
    (!!navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

export const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && !!navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

export const isAndroid = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  return /Android/i.test(navigator.userAgent);
}; 