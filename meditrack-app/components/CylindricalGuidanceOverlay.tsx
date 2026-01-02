import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Svg, { 
  Circle, 
  Ellipse, 
  Path, 
  Defs, 
  LinearGradient, 
  Stop,
  G
} from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CylindricalGuidanceOverlayProps {
  isRecording: boolean;
  rotationProgress: number;
  colorScheme: 'light' | 'dark';
}

export function CylindricalGuidanceOverlay({ 
  isRecording, 
  rotationProgress, 
  colorScheme 
}: CylindricalGuidanceOverlayProps) {
  const overlayWidth = screenWidth * 0.8;
  const overlayHeight = screenHeight * 0.4;
  const centerX = overlayWidth / 2;
  const centerY = overlayHeight / 2;
  
  // Calculate rotation indicator position
  const angle = (rotationProgress / 100) * 360;
  const indicatorRadius = Math.min(overlayWidth, overlayHeight) * 0.35;
  const indicatorX = centerX + indicatorRadius * Math.cos((angle - 90) * Math.PI / 180);
  const indicatorY = centerY + indicatorRadius * Math.sin((angle - 90) * Math.PI / 180);

  const textColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
  const accentColor = '#00FF88';
  const secondaryColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

  return (
    <View style={styles.container}>
      {/* Top guidance text */}
      <View style={styles.instructionContainer}>
        <Text style={[styles.instructionTitle, { color: textColor }]}>
          {isRecording ? 'Recording in Progress' : 'Position Bottle for Scanning'}
        </Text>
        <Text style={[styles.instructionText, { color: secondaryColor }]}>
          {isRecording 
            ? 'Slowly rotate around the bottle in a circle'
            : 'Hold bottle vertically, 6-8 inches from camera'
          }
        </Text>
      </View>

      {/* Cylindrical bottle outline and guidance */}
      <View style={styles.svgContainer}>
        <Svg width={overlayWidth} height={overlayHeight}>
          <Defs>
            <LinearGradient id="cylinderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
              <Stop offset="50%" stopColor={accentColor} stopOpacity="0.1" />
              <Stop offset="100%" stopColor={accentColor} stopOpacity="0.3" />
            </LinearGradient>
            <LinearGradient id="labelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#FFA500" stopOpacity="0.4" />
            </LinearGradient>
          </Defs>

          {/* Cylindrical bottle representation */}
          <G>
            {/* Main cylinder body */}
            <Ellipse
              cx={centerX}
              cy={centerY - 40}
              rx={60}
              ry={15}
              fill={secondaryColor}
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray={isRecording ? "0" : "5,5"}
            />
            <Ellipse
              cx={centerX}
              cy={centerY + 40}
              rx={60}
              ry={15}
              fill={secondaryColor}
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray={isRecording ? "0" : "5,5"}
            />
            {/* Cylinder sides */}
            <Path
              d={`M ${centerX - 60} ${centerY - 40} L ${centerX - 60} ${centerY + 40}`}
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray={isRecording ? "0" : "5,5"}
            />
            <Path
              d={`M ${centerX + 60} ${centerY - 40} L ${centerX + 60} ${centerY + 40}`}
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray={isRecording ? "0" : "5,5"}
            />
            
            {/* Label area on cylinder */}
            <Path
              d={`M ${centerX - 50} ${centerY - 20} 
                  Q ${centerX} ${centerY - 30} ${centerX + 50} ${centerY - 20}
                  L ${centerX + 50} ${centerY + 20}
                  Q ${centerX} ${centerY + 30} ${centerX - 50} ${centerY + 20}
                  Z`}
              fill="url(#labelGradient)"
              stroke="#FFD700"
              strokeWidth="1"
            />
          </G>

          {/* Rotation path indicator */}
          {isRecording && (
            <G>
              {/* Rotation circle */}
              <Circle
                cx={centerX}
                cy={centerY}
                r={indicatorRadius}
                fill="none"
                stroke={secondaryColor}
                strokeWidth="2"
                strokeDasharray="10,5"
              />
              
              {/* Progress arc */}
              <Path
                d={`M ${centerX} ${centerY - indicatorRadius}
                    A ${indicatorRadius} ${indicatorRadius} 0 ${angle > 180 ? 1 : 0} 1 ${indicatorX} ${indicatorY}`}
                fill="none"
                stroke={accentColor}
                strokeWidth="4"
                strokeLinecap="round"
              />
              
              {/* Current position indicator */}
              <Circle
                cx={indicatorX}
                cy={indicatorY}
                r="8"
                fill={accentColor}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              
              {/* Camera icon at current position */}
              <Circle
                cx={indicatorX}
                cy={indicatorY}
                r="4"
                fill="#FFFFFF"
              />
            </G>
          )}

          {/* Quality indicators */}
          {!isRecording && (
            <G>
              {/* Optimal distance indicators */}
              <Circle
                cx={centerX - 80}
                cy={centerY}
                r="3"
                fill={accentColor}
                opacity="0.7"
              />
              <Circle
                cx={centerX + 80}
                cy={centerY}
                r="3"
                fill={accentColor}
                opacity="0.7"
              />
              
              {/* Distance guide lines */}
              <Path
                d={`M ${centerX - 77} ${centerY} L ${centerX - 63} ${centerY}`}
                stroke={accentColor}
                strokeWidth="1"
                opacity="0.7"
              />
              <Path
                d={`M ${centerX + 63} ${centerY} L ${centerX + 77} ${centerY}`}
                stroke={accentColor}
                strokeWidth="1"
                opacity="0.7"
              />
            </G>
          )}
        </Svg>
      </View>

      {/* Progress and tips */}
      {isRecording && (
        <View style={styles.progressContainer}>
          <Text style={[styles.progressText, { color: textColor }]}>
            {Math.round(rotationProgress)}% Complete
          </Text>
          <View style={[styles.progressBar, { backgroundColor: secondaryColor }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: accentColor,
                  width: `${rotationProgress}%`
                }
              ]} 
            />
          </View>
        </View>
      )}

      {/* Tips section */}
      {!isRecording && (
        <View style={styles.tipsContainer}>
          <Text style={[styles.tipsTitle, { color: textColor }]}>Tips for Best Results:</Text>
          <Text style={[styles.tipText, { color: secondaryColor }]}>
            • Ensure good lighting on the label
          </Text>
          <Text style={[styles.tipText, { color: secondaryColor }]}>
            • Keep bottle steady while you move around it
          </Text>
          <Text style={[styles.tipText, { color: secondaryColor }]}>
            • Complete a full 360° rotation slowly
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingTop: 100,
    paddingBottom: 120,
    paddingHorizontal: 20,
    pointerEvents: 'none',
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  svgContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  progressBar: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tipsContainer: {
    alignItems: 'flex-start',
    marginTop: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
});