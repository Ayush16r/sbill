// hooks/useHaptics.ts
import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export function useHaptics() {
  const lightImpact = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Safe fallback when not on a real device or if library is missing/errored
    }
  }, []);

  const mediumImpact = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Safe fallback
    }
  }, []);

  const heavyImpact = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Safe fallback
    }
  }, []);

  const selectionClick = useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Safe fallback
    }
  }, []);

  const successNotification = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Safe fallback
    }
  }, []);

  const errorNotification = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Safe fallback
    }
  }, []);

  const warningNotification = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Safe fallback
    }
  }, []);

  return {
    lightImpact,
    mediumImpact,
    heavyImpact,
    selectionClick,
    successNotification,
    errorNotification,
    warningNotification,
  };
}
export default useHaptics;
