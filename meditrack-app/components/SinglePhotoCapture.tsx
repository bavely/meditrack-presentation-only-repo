import { CameraView, useCameraPermissions } from 'expo-camera';
import { CameraType } from 'expo-image-picker';
import { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CameraControls from './CameraControls';

interface Props {
  onCaptureComplete: (imageUri: string) => void;
  onCancel: () => void;
}

export default function SinglePhotoCapture({ onCaptureComplete, onCancel }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  if (!permission?.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Camera permission is required.</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={[styles.text, { color: '#4da3ff' }]}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      onCaptureComplete(photo.uri);
    } catch (e) {
      console.warn('Capture failed', e);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={CameraType.back} />
      <CameraControls onClose={onCancel} onCapture={handleCapture} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  text: { color: '#fff', fontSize: 16 },
});

