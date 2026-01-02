const React = require('react');
const Button = ({ children, onPress }) => React.createElement('Button', { onClick: onPress }, children);
module.exports = { Button };
