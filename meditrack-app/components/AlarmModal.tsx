import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import Button from './ui/Button';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { spacing, borderRadius } from '@/constants/Theme';
import { SNOOZE_OPTIONS } from '@/constants/notifications';
import { isCriticalMedication } from '@/utils/isCriticalMedication';

interface AlarmModalProps {
  visible: boolean;
  onTaken: () => void;
  onSkip: () => void;
  onSnooze: (minutes?: number) => void;
  medicationName?: string;
  dosage?: string;
  instructions?: string;
  color?: string;
  scheduledTime?: string;
  snoozeCount?: number;
}

export default function AlarmModal({ 
  visible, 
  onTaken, 
  onSkip, 
  onSnooze,
  medicationName = 'Your medication',
  dosage,
  instructions,
  color,
  scheduledTime,
  snoozeCount = 0,
}: AlarmModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const soundRef = useRef<Audio.Sound | null>(null);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function playSound() {
      if (visible) {
        try {
          // Ensure audio session is properly configured
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            playsInSilentModeIOS: true, // Important: plays even when device is silenced
            shouldDuckAndroid: true,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: true,
          });

          const isCritical = isCriticalMedication({
            name: medicationName,
            instructions,
          });

          const soundFile = isCritical
            ? require('../assets/sounds/med_critical.wav')
            : require('../assets/sounds/med_alarm.wav');
          
          const { sound } = await Audio.Sound.createAsync(
            soundFile,
            { 
              isLooping: true,
              shouldPlay: true,
              volume: 1.0,
            }
          );
          if (!isMounted) {
            // Clean up if component unmounted while loading
            await sound.unloadAsync();
            return;
          }
          soundRef.current = sound;
          
          // Set volume to maximum for alarm
          await sound.setVolumeAsync(1.0);
          await sound.playAsync();
          
          console.log('[AlarmModal] Started playing alarm sound, critical:', isCritical);
        } catch (e) {
          console.warn('Failed to play alarm sound:', e);
          // If sound fails, try to play a basic system sound as fallback
          try {
            const fallbackSound = isCriticalMedication({ name: medicationName, instructions })
              ? require('../assets/sounds/med_alarm.wav') // Use basic alarm for critical if critical fails
              : require('../assets/sounds/med_alarm.wav');
            
            const { sound: fallbackAudio } = await Audio.Sound.createAsync(
              fallbackSound,
              { isLooping: true, shouldPlay: true, volume: 1.0 }
            );
            if (isMounted) {
              soundRef.current = fallbackAudio;
              console.log('[AlarmModal] Playing fallback alarm sound');
            } else {
              await fallbackAudio.unloadAsync();
            }
          } catch (fallbackError) {
            console.error('Failed to play fallback alarm sound:', fallbackError);
          }
        }
      } else if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          console.log('[AlarmModal] Stopped alarm sound');
        } catch (e) {
          console.warn('Failed to stop alarm sound:', e);
        }
        soundRef.current = null;
      }
    }

    playSound();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.stopAsync().finally(() => {
          soundRef.current?.unloadAsync();
          soundRef.current = null;
        });
      }
    };
  }, [visible, medicationName, instructions]);

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const time = new Date(timeString);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSnooze = (minutes: number) => {
    setShowSnoozeOptions(false);
    onSnooze(minutes);
  };

  if (!visible) return null;

  const isCritical = isCriticalMedication({
    name: medicationName,
    instructions,
  });

  return (
    <Modal 
      transparent 
      visible={visible} 
      animationType="fade" 
      onRequestClose={onSkip}
      statusBarTranslucent={true}
    >
      <View style={[styles.overlay, { backgroundColor: Colors[colorScheme].text + '90' }]}> 
        <View style={[
          styles.container, 
          { backgroundColor: Colors[colorScheme].surface },
          isCritical && styles.criticalContainer
        ]}> 
          
          {/* Critical Badge */}
          {isCritical && (
            <View style={styles.criticalBadge}>
              <Text style={styles.criticalBadgeText}>IMPORTANT</Text>
            </View>
          )}
          
          {/* Medication Header */}
          <View style={styles.header}>
            {color && (
              <View style={[
                styles.colorIndicator, 
                { backgroundColor: color },
                isCritical && styles.criticalIndicator
              ]} />
            )}
            <View style={styles.headerContent}>
              <Text style={[
                styles.title, 
                { color: Colors[colorScheme].text },
                isCritical && styles.criticalTitle
              ]}>
                {medicationName}
              </Text>
              {scheduledTime && (
                <Text style={[styles.time, { color: Colors[colorScheme].text }]}>
                  Scheduled for {formatTime(scheduledTime)}
                </Text>
              )}
            </View>
          </View>

          {/* Dosage and Instructions */}
          {dosage && (
            <Text style={[styles.dosage, { color: Colors[colorScheme].text }]}>
              Take {dosage}
            </Text>
          )}
          
          {instructions && (
            <Text style={[styles.instructions, { color: Colors[colorScheme].text }]}>
              {instructions}
            </Text>
          )}

          {/* Snooze Count Warning */}
          {snoozeCount > 0 && (
            <Text style={[styles.snoozeWarning, { color: Colors[colorScheme].text }]}>
              Snoozed {snoozeCount} time{snoozeCount > 1 ? 's' : ''}
            </Text>
          )}

          {/* Main Actions */}
          {!showSnoozeOptions ? (
            <View style={styles.actions}>
              <Button title="Taken" onPress={onTaken} style={styles.primaryButton} />
              <Button title="Skip" variant="secondary" onPress={onSkip} />
              <Button 
                title="Snooze" 
                variant="outline" 
                onPress={() => setShowSnoozeOptions(true)} 
              />
            </View>
          ) : (
            /* Snooze Options */
            <View style={styles.snoozeContainer}>
              <Text style={[styles.snoozeTitle, { color: Colors[colorScheme].text }]}>
                Snooze for:
              </Text>
              <View style={styles.snoozeActions}>
                <Button 
                  title={`${SNOOZE_OPTIONS.SHORT}min`}
                  variant="outline" 
                  onPress={() => handleSnooze(SNOOZE_OPTIONS.SHORT)}
                  style={styles.snoozeButton}
                />
                <Button 
                  title={`${SNOOZE_OPTIONS.MEDIUM}min`}
                  variant="outline" 
                  onPress={() => handleSnooze(SNOOZE_OPTIONS.MEDIUM)}
                  style={styles.snoozeButton}
                />
                <Button 
                  title={`${SNOOZE_OPTIONS.LONG}min`}
                  variant="outline" 
                  onPress={() => handleSnooze(SNOOZE_OPTIONS.LONG)}
                  style={styles.snoozeButton}
                />
              </View>
              <Button 
                title="Cancel" 
                variant="secondary" 
                onPress={() => setShowSnoozeOptions(false)} 
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  criticalContainer: {
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  criticalBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  criticalBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  colorIndicator: {
    width: 6,
    height: 40,
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  criticalIndicator: {
    width: 8,
    height: 40,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  criticalTitle: {
    fontSize: 22,
    color: '#DC2626',
  },
  time: {
    fontSize: 14,
    opacity: 0.7,
  },
  dosage: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  instructions: {
    fontSize: 14,
    marginBottom: spacing.md,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  snoozeWarning: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '500',
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
  },
  snoozeContainer: {
    alignItems: 'center',
  },
  snoozeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  snoozeActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  snoozeButton: {
    minWidth: 60,
  },
});

