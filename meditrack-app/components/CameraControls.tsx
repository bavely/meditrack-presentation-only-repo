import { Flashlight, FlashlightOff, Info, X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface Props {
  onClose: () => void;
  onCapture: () => void;
  captureIcon?: React.ReactNode;
  captureDisabled?: boolean;
  captureActive?: boolean;
  onToggleFlash?: () => void;
  flashEnabled?: boolean;
  flashDisabled?: boolean;
  onToggleGuidance?: () => void;
  guidanceEnabled?: boolean;
  bottomLeft?: React.ReactNode;
  bottomRight?: React.ReactNode;
}

export default function CameraControls({
  onClose,
  onCapture,
  captureIcon,
  captureDisabled,
  captureActive,
  onToggleFlash,
  flashEnabled,
  flashDisabled,
  onToggleGuidance,
  guidanceEnabled,
  bottomLeft,
  bottomRight,
}: Props) {
  return (
    <>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <X size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {onToggleFlash && (
        <TouchableOpacity
          style={styles.flashButton}
          onPress={onToggleFlash}
          disabled={flashDisabled}
        >
          {flashEnabled ? (
            <Flashlight size={24} color="#FFD700" />
          ) : (
            <FlashlightOff size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      )}

      {onToggleGuidance && (
        <TouchableOpacity
          style={styles.guidanceButton}
          onPress={onToggleGuidance}
        >
          <Info size={20} color={guidanceEnabled ? '#00FF88' : '#FFFFFF'} />
        </TouchableOpacity>
      )}

      <View style={styles.controls}>
        {bottomLeft || <View style={styles.placeholderButton} />}
        <TouchableOpacity
          style={[
            styles.captureButton,
            captureDisabled && styles.disabledButton,
            captureActive && styles.stopButton,
          ]}
          onPress={onCapture}
          disabled={captureDisabled}
        >
          {captureIcon}
        </TouchableOpacity>
        {bottomRight || <View style={styles.placeholderButton} />}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 2,
  },
  flashButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 2,
  },
  guidanceButton: {
    position: 'absolute',
    top: 40,
    right: 70,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  stopButton: {
    backgroundColor: '#FF0000',
  },
  disabledButton: {
    opacity: 0.5,
  },
  placeholderButton: {
    width: 60,
    height: 60,
  },
});
