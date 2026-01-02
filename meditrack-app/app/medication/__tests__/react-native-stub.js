const React = require('react');

const View = (props) => React.createElement('View', props, props.children);
const Text = (props) => React.createElement('Text', props, props.children);
const SafeAreaView = (props) => React.createElement('SafeAreaView', props, props.children);
const FlatList = (props) => React.createElement('FlatList', props, props.children);
const StyleSheet = { create: (styles) => styles };

module.exports = { View, Text, SafeAreaView, FlatList, StyleSheet };
