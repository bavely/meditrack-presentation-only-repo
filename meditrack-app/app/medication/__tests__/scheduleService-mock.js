let calls = 0;
async function getDoseTimesByDate(date){
  calls++;
  return { success: true, data: [] };
}
async function getDoseTimesByDateRange(start, end){
  return { success: true, data: [] };
}
module.exports = {
  getDoseTimesByDate,
  getDoseTimesByDateRange,
  __calls: () => calls,
  __reset: () => { calls = 0; }
};
