function Stack(props){
  return { type: 'Stack', props };
}
Stack.Screen = function Screen(props){
  return { type: 'Screen', props };
};
module.exports = { Stack };
