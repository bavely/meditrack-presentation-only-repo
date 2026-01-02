/* eslint-env node */
/* eslint-disable no-undef */
const assert = require('node:assert');
const Module = require('module');
const path = require('path');

// Stub modules used by CalendarScreen
const moduleMap = {
  '@/components/DoseCard': path.resolve(__dirname, './dose-card-stub.js'),
  '@/components/EmptyState': path.resolve(__dirname, './empty-state-stub.js'),
  '@/constants/Colors': path.resolve(__dirname, './colors-stub.js'),
  '@/hooks/useColorScheme': path.resolve(__dirname, './useColorScheme-stub.js'),
  '@/services/scheduleService': path.resolve(__dirname, './scheduleService-mock.js'),
  '@/store/medication-store': path.resolve(__dirname, './medication-store-stub.js'),
  '../../constants/Theme': path.resolve(__dirname, './theme-stub.js'),
  'react-native': path.resolve(__dirname, './react-native-stub.js'),
  'react-native-calendars': path.resolve(__dirname, './calendars-stub.js'),
  'react-native-paper': path.resolve(__dirname, './paper-stub.js'),
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (moduleMap[request]) {
    return moduleMap[request];
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

const React = require('react');
const TestRenderer = require('react-test-renderer');
const { __getProps } = require('./calendars-stub.js');
const scheduleMock = require('./scheduleService-mock.js');

const { default: CalendarScreen } = require('../calendar');

(async () => {
  scheduleMock.__reset();
  let renderer;
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(CalendarScreen));
  });
  // After initial render, one request should be made
  assert.strictEqual(scheduleMock.__calls(), 1);

  // Simulate selecting a new date
  const newDate = '2024-01-02';
  await TestRenderer.act(async () => {
    await __getProps().calendar.onDayPress({ dateString: newDate });
  });

  // After pressing, only one additional request should be made
  assert.strictEqual(scheduleMock.__calls(), 2);

  console.log('Calendar day selection triggers single request');
})();
