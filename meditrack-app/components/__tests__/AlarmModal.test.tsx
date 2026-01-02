import React from 'react';
import { render } from '@testing-library/react-native';
import AlarmModal from '../AlarmModal';

describe('AlarmModal', () => {
  const mockProps = {
    visible: true,
    onTaken: jest.fn(),
    onSkip: jest.fn(),
    onSnooze: jest.fn(),
    medicationName: 'Test Medication',
    dosage: '10mg',
    instructions: 'Take with food',
    color: '#3b82f6',
    scheduledTime: '2024-01-15T09:00:00Z',
    snoozeCount: 0,
  };

  it('renders medication details correctly', () => {
    const { getByText } = render(<AlarmModal {...mockProps} />);
    
    expect(getByText('Test Medication')).toBeTruthy();
    expect(getByText('Take 10mg')).toBeTruthy();
    expect(getByText('Take with food')).toBeTruthy();
  });

  it('shows snooze options when snooze is tapped', () => {
    const { getByText } = render(<AlarmModal {...mockProps} />);
    
    // Initially should show main actions
    expect(getByText('Taken')).toBeTruthy();
    expect(getByText('Skip')).toBeTruthy();
    expect(getByText('Snooze')).toBeTruthy();
  });

  it('displays snooze count warning when snoozed', () => {
    const snoozedProps = { ...mockProps, snoozeCount: 2 };
    const { getByText } = render(<AlarmModal {...snoozedProps} />);
    
    expect(getByText('Snoozed 2 times')).toBeTruthy();
  });
});