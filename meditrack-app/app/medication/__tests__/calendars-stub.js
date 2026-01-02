const React = require('react');
let lastProps = {};
function ExpandableCalendar(props) {
  lastProps = props;
  return null;
}
ExpandableCalendar.positions = { OPEN: 'OPEN', CLOSED: 'CLOSED' };
function CalendarProvider({ children, ...rest }) {
  CalendarProvider.props = { ...rest };
  return React.createElement(React.Fragment, null, children);
}
module.exports = {
  ExpandableCalendar,
  CalendarProvider,
  __getProps: () => ({ calendar: lastProps, provider: CalendarProvider.props }),
};
