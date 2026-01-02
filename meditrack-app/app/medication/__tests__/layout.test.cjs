/* eslint-env node */
/* eslint-disable no-undef */
const assert = require('node:assert');
const Module = require('module');
const path = require('path');
const React = require('react');
global.React = React;

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'expo-router') {
    return path.resolve(__dirname, './expo-router-stub.js');
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

const MedicationLayout = require('../_layout').default;

const element = MedicationLayout();
const rawChildren = element.props.children;
const screens = Array.isArray(rawChildren) ? rawChildren.flat() : [rawChildren];

const expected = {
  add: 'Add Medication',
  scan: 'Scan Medication',
  manually: 'Add Manually',
  voice: 'Speak Label',
  confirmation: 'Confirm Medication',
  registered: 'Medication Registered',
  '[id]': 'Medication',
};

for (const [name, title] of Object.entries(expected)) {
  const screen = screens.find((s) => s.props.name === name);
  assert(screen, `Screen '${name}' not found`);
  assert.strictEqual(screen.props.options?.title, title);
}

console.log('Medication screen titles verified');


