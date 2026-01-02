import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { CameraType } from 'expo-image-picker';
import { RefreshCcw, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CameraControls from './CameraControls';

interface Props {
  onCaptureComplete: (images: string[]) => void;
  onCancel: () => void;
}

export default function PanoramaCapture({ onCaptureComplete, onCancel }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);

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
      if (retakeIndex !== null) {
        const next = [...images];
        await FileSystem.deleteAsync(next[retakeIndex], { idempotent: true }).catch(() => {});
        next[retakeIndex] = photo.uri;
        setImages(next);
        setRetakeIndex(null);
      } else {
        setImages([...images, photo.uri]);
      }
    } catch (e) {
      console.warn('Capture failed', e);
    }
  };

  const handleDelete = async (index: number) => {
    const uri = images[index];
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
    setImages(images.filter((_, i) => i !== index));
  };

  const handleRetake = (index: number) => {
    setRetakeIndex(index);
  };

  const handleDone = () => {
    onCaptureComplete(images);
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={CameraType.back} />
      <CameraControls onClose={onCancel} onCapture={handleCapture} />
      {images.length > 0 && (
        <TouchableOpacity onPress={handleDone} style={styles.processButton}>
          <Text style={styles.processText}>Process</Text>
        </TouchableOpacity>
      )}
      <View style={styles.thumbnailStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {images.map((uri, index) => (
            <View key={uri} style={styles.thumbnailContainer}>
              <Image source={{ uri }} style={styles.thumbnail} />
              <View style={styles.thumbActions}>
                <TouchableOpacity onPress={() => handleRetake(index)} style={styles.thumbButton}>
                  <RefreshCcw color="#fff" size={16} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(index)} style={styles.thumbButton}>
                  <X color="#fff" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  processButton: {
    position: 'absolute',
    right: 20,
    bottom: 60,
    backgroundColor: '#007aff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  processText: { color: '#fff', fontSize: 16 },
  thumbnailStrip: { position: 'absolute', bottom: 120, width: '100%' },
  thumbnailContainer: { marginHorizontal: 5 },
  thumbnail: { width: 80, height: 80, borderRadius: 4 },
  thumbActions: { position: 'absolute', top: 2, right: 2, flexDirection: 'row' },
  thumbButton: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 2, marginLeft: 2, borderRadius: 3 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  text: { color: '#fff', fontSize: 16 },
});
