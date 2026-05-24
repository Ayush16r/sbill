import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Trash2, Zap, ZapOff, Image as ImageIcon, Plus } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useUIStore } from '../../store/uiStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/currency';

interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
}

export default function ScanReceiptScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const showToast = useUIStore((state) => state.showToast);

  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [scanning, setScanning] = useState(false);

  // Receipt form states after photo selection
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([{ name: 'Pizza', qty: 1, price: 599 }]);
  const [tax, setTax] = useState('45');

  const cameraRef = useRef<CameraView>(null);

  const handleCapture = async () => {
    if (!cameraRef.current || scanning) return;
    setScanning(true);

    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      
      // Simulate receipt scanning analysis delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setPhotoUri(picture?.uri || 'placeholder');
      showToast('Image captured! Let us itemize the receipt.', 'success');
    } catch (err) {
      showToast('Failed to capture receipt. Try again.', 'error');
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
        // Simulate receipt scanning analysis delay
        await new Promise((resolve) => setTimeout(resolve, 1200));

        setPhotoUri(result.assets[0].uri);
        showToast('Receipt loaded! Let us itemize.', 'success');
      }
    } catch (err) {
      showToast('Failed to select image.', 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { name: `Item ${items.length + 1}`, qty: 1, price: 0 }]);
  };

  const handleUpdateItem = (index: number, key: keyof ReceiptItem, val: string) => {
    const updated = [...items];
    if (key === 'qty') {
      updated[index].qty = parseInt(val) || 0;
    } else if (key === 'price') {
      updated[index].price = parseFloat(val) || 0;
    } else {
      updated[index].name = val;
    }
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      showToast('Need at least one item on the receipt.', 'error');
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const parsedTax = parseFloat(tax) || 0;
  const grandTotal = subtotal + parsedTax;

  const handleSaveReceipt = () => {
    if (grandTotal <= 0) {
      showToast('Receipt total must be greater than ₹0.', 'error');
      return;
    }
    const desc = items.length === 1 ? items[0].name : `${items[0].name} + ${items.length - 1} items`;
    router.replace({
      pathname: '/expense/add',
      params: {
        scannedTitle: desc,
        scannedAmount: grandTotal.toFixed(2),
      },
    });
  };

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: '#000' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
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

  // Render receipt itemisation form if photo has been taken
  if (photoUri) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={[styles.formHeader, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => setPhotoUri(null)} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.formHeaderTitle, { color: colors.textPrimary }]}>Receipt Items</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.formScrollContent} keyboardShouldPersistTaps="handled">
          <Card variant="glow" padding={16} style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Grand Total</Text>
            <Text style={[styles.summaryAmount, { color: colors.primary }]}>{formatCurrency(grandTotal)}</Text>
          </Card>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Itemized Breakdown</Text>
          {items.map((item, idx) => (
            <Card key={idx} variant="glass" padding={14} style={styles.itemRowCard}>
              <View style={styles.itemMainRow}>
                <TextInput
                  placeholder="Item description (e.g. Pizza)"
                  placeholderTextColor={colors.gray400}
                  value={item.name}
                  onChangeText={(v) => handleUpdateItem(idx, 'name', v)}
                  style={[styles.itemNameInput, { color: colors.textPrimary, borderBottomColor: colors.border }]}
                />
                <Pressable onPress={() => handleRemoveItem(idx)} style={{ padding: 4 }}>
                  <Trash2 size={16} color={colors.danger} />
                </Pressable>
              </View>

              <View style={styles.itemDetailsRow}>
                <View style={styles.inputCol}>
                  <Text style={[styles.colLabel, { color: colors.textSecondary }]}>Qty</Text>
                  <TextInput
                    placeholder="1"
                    placeholderTextColor={colors.gray400}
                    keyboardType="number-pad"
                    value={item.qty.toString()}
                    onChangeText={(v) => handleUpdateItem(idx, 'qty', v)}
                    style={[styles.smallInput, { color: colors.textPrimary, borderColor: colors.border }]}
                  />
                </View>

                <View style={[styles.inputCol, { flex: 1.5 }]}>
                  <Text style={[styles.colLabel, { color: colors.textSecondary }]}>Unit Price (₹)</Text>
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor={colors.gray400}
                    keyboardType="decimal-pad"
                    value={item.price === 0 ? '' : item.price.toString()}
                    onChangeText={(v) => handleUpdateItem(idx, 'price', v)}
                    style={[styles.smallInput, { color: colors.textPrimary, borderColor: colors.border }]}
                  />
                </View>

                <View style={styles.totalCol}>
                  <Text style={[styles.colLabel, { color: colors.textSecondary }]}>Total</Text>
                  <Text style={[styles.lineTotalText, { color: colors.textPrimary }]}>
                    {formatCurrency(item.qty * item.price)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}

          <Button
            title="Add Item"
            variant="outline"
            onPress={handleAddItem}
            style={styles.addBtn}
          />

          <View style={[styles.taxSection, { borderTopColor: colors.border }]}>
            <View style={styles.taxRow}>
              <Text style={[styles.taxLabel, { color: colors.textPrimary }]}>Subtotal</Text>
              <Text style={[styles.taxValue, { color: colors.textSecondary }]}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.taxRow}>
              <Text style={[styles.taxLabel, { color: colors.textPrimary }]}>Tax / Tip (₹)</Text>
              <TextInput
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.gray400}
                value={tax}
                onChangeText={setTax}
                style={[styles.taxInput, { color: colors.textPrimary, borderColor: colors.border }]}
              />
            </View>
          </View>

          <Button
            title="Save to Bill"
            onPress={handleSaveReceipt}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Camera capture UI
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
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
            {scanning ? 'Analyzing receipt image...' : 'Align receipt within the frame'}
          </Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <View style={{ width: 52 }} /> {/* Placeholder to balance list btn */}

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
    height: 360,
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
    marginTop: 24,
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

  // Receipt Form styles
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  formHeaderTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  formScrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  summaryCard: { alignItems: 'center', marginBottom: 24 },
  summaryLabel: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  summaryAmount: { fontSize: 32, fontFamily: 'SpaceGrotesk', fontWeight: '900', letterSpacing: -1 },
  sectionTitle: { fontSize: 15, fontFamily: 'SpaceGrotesk', fontWeight: '700', marginBottom: 12 },
  itemRowCard: { marginVertical: 6 },
  itemMainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemNameInput: { flex: 1, fontSize: 14, fontFamily: 'Nunito', fontWeight: '700', paddingVertical: 4, marginRight: 12, borderBottomWidth: 1 },
  itemDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  inputCol: { flex: 1 },
  colLabel: { fontSize: 10, fontFamily: 'Nunito', fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  smallInput: { borderWidth: 1, borderRadius: 8, height: 36, paddingHorizontal: 8, fontSize: 13, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  totalCol: { flex: 1.5, alignItems: 'flex-end', justifyContent: 'center', height: 36 },
  lineTotalText: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  addBtn: { marginVertical: 12 },
  taxSection: { borderTopWidth: 1, paddingTop: 16, marginTop: 12, gap: 12 },
  taxRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taxLabel: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '700' },
  taxValue: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  taxInput: { borderWidth: 1, borderRadius: 8, width: 80, height: 36, textAlign: 'center', fontSize: 13, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  saveBtn: { marginTop: 24 },
});
