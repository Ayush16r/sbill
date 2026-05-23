import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, RotateCcw, Zap, ZapOff, Image as ImageIcon } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useUIStore } from '../../store/uiStore';

export default function ScanReceiptScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const showToast = useUIStore((state) => state.showToast);

  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [scanning, setScanning] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  const cameraRef = useRef<CameraView>(null);

  const handleCapture = async () => {
    if (!cameraRef.current || scanning) return;
    setScanning(true);

    try {
      // Capture image using expo-camera API
      await cameraRef.current.takePictureAsync({ quality: 0.7 });

      // Simulate OCR processing
      await new Promise((resolve) => setTimeout(resolve, 1800));

      showToast('Receipt scanned! Fill in the details below.', 'success');

      router.replace({
        pathname: '/expense/add',
        params: { scannedTitle: 'Scanned Receipt' },
      });
    } catch (err) {
      showToast('Failed to capture. Try again.', 'error');
    } finally {
      setScanning(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission to access photos is required.', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setScanning(true);
        // Simulate OCR processing
        await new Promise((resolve) => setTimeout(resolve, 1500));

        showToast('Receipt image loaded! Fill in details.', 'success');

        router.replace({
          pathname: '/expense/add',
          params: { scannedTitle: 'Scanned Receipt' },
        });
      }
    } catch (err) {
      showToast('Failed to select image.', 'error');
    } finally {
      setScanning(false);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: '#000' }]}>
        <ActivityIndicator color="#22C55E" size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.permDeniedEmoji}>📷</Text>
        <Text style={[styles.permTitle, { color: colors.textPrimary }]}>Camera Access Required</Text>
        <Text style={[styles.permSubtitle, { color: colors.textSecondary }]}>
          Please allow camera access to scan and split receipts.
        </Text>
        <Pressable onPress={requestPermission} style={[styles.permBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'SpaceGrotesk', fontWeight: '700' }}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.topBarBtn}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.topBarTitle}>Scan Receipt</Text>
          <Pressable
            onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
            style={styles.topBarBtn}
          >
            {flash === 'on'
              ? <Zap size={22} color="#F59E0B" />
              : <ZapOff size={22} color="#FFFFFF" />}
          </Pressable>
        </View>

        {/* Scan frame overlay */}
        <View style={styles.scanOverlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.scanHint}>
            {scanning ? 'Reading receipt...' : 'Align receipt within the frame'}
          </Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          {/* Flip camera */}
          <Pressable
            onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            style={styles.controlBtn}
          >
            <RotateCcw size={22} color="#FFFFFF" />
          </Pressable>

          {/* Capture trigger */}
          <Pressable
            onPress={handleCapture}
            disabled={scanning}
            style={[styles.captureBtn, scanning && styles.captureBtnDisabled]}
          >
            {scanning
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <View style={styles.captureBtnInner} />}
          </Pressable>

          {/* Gallery selector fallback */}
          <Pressable
            onPress={handlePickImage}
            disabled={scanning}
            style={styles.controlBtn}
          >
            <ImageIcon size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topBarBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  topBarTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    color: '#FFFFFF',
  },

  scanOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanFrame: {
    width: 280,
    height: 200,
    borderRadius: 12,
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scanHint: {
    color: '#FFFFFF',
    fontFamily: 'Nunito',
    fontWeight: '700',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
    opacity: 0.85,
  },

  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#22C55E',
  },
  topLeft: {
    top: -1,
    left: -1,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: -1,
    right: -1,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 6,
  },

  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 50,
    paddingTop: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  captureBtnDisabled: { opacity: 0.6 },
  captureBtnInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  permDeniedEmoji: { fontSize: 60, marginBottom: 20 },
  permTitle: { fontSize: 22, fontFamily: 'SpaceGrotesk', fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  permSubtitle: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '600', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  permBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, marginBottom: 12 },
  permBtnText: { fontSize: 15, fontFamily: 'SpaceGrotesk', fontWeight: '700', color: '#FFFFFF' },
});
