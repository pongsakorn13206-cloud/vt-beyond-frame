'use client';
import { useState, useEffect, useCallback } from 'react';

export function useFaceDetection() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [faceModule, setFaceModule] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const mod = await import('@/lib/face-detection');
        await mod.loadModels();
        if (!cancelled) {
          setFaceModule(mod);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const detectFaces = useCallback(
    async (imageElement) => {
      if (!faceModule) throw new Error('Models not loaded');
      return faceModule.detectAllFaces(imageElement);
    },
    [faceModule]
  );

  const detectSingleFace = useCallback(
    async (imageElement) => {
      if (!faceModule) throw new Error('Models not loaded');
      return faceModule.detectSingleFace(imageElement);
    },
    [faceModule]
  );

  return { isLoading, error, detectFaces, detectSingleFace, isReady: !!faceModule };
}
