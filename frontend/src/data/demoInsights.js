// Demo insights used for development to make charts visual
const days = (n) => {
  const arr = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(d.toISOString());
  }
  return arr;
};

const dates = days(14);

const chartData = dates.map((date, idx) => ({
  date,
  // create a simple wave pattern between 2 and 5
  mood: Math.round(2 + 2.5 * Math.abs(Math.sin(idx / 3)) )
}));

const demoInsights = {
  chartData,
  averageMood: (
    chartData.reduce((s, d) => s + d.mood, 0) / chartData.length
  ),
  completionRate: 0.72,
  topTriggers: ['Work', 'Sleep', 'Diet'],
  message: 'Demo: Your recent mood has been generally positive with small dips mid-week.'
};

export default demoInsights;
