import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from './theme';

export type ToastType = 'info' | 'error';
export type ToastFn = (message: string, type?: ToastType) => void;

const ToastContext = createContext<ToastFn>(() => {});

export const useToast = (): ToastFn => useContext(ToastContext);

interface ToastState {
  message: string;
  type: ToastType;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: false }).start(() =>
      setToast(null)
    );
  }, [opacity]);

  const show = useCallback<ToastFn>(
    (message, type = 'info') => {
      setToast({ message, type });
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: false }).start();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(hide, 2600);
    },
    [hide, opacity]
  );

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  const accent = toast?.type === 'error' ? colors.warning : colors.primary;

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <Animated.View
          style={[styles.toast, { opacity, borderLeftColor: accent }]}
          pointerEvents="none"
        >
          <Text style={styles.message}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    backgroundColor: '#1a1a1a',
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  message: { color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
