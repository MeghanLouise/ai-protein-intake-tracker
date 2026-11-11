interface Point {
  date: string;
  weight: number;
}

interface Props {
  points: Point[];
}

const WIDTH = 600;
const HEIGHT = 220;
const PAD_X = 28;
const PAD_Y = 28;

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// A minimal inline SVG line chart (no charting library in this project) plotting one weight value
// per date, in chronological order.
export default function WeightChart({ points }: Props) {
  const weights = points.map((p) => p.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const xFor = (i: number) =>
    points.length === 1 ? WIDTH / 2 : PAD_X + (i / (points.length - 1)) * (WIDTH - 2 * PAD_X);
  const yFor = (w: number) => HEIGHT - PAD_Y - ((w - min) / range) * (HEIGHT - 2 * PAD_Y);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.weight)}`).join(' ');

  // Thin out date labels so they don't overlap when there are many points.
  const labelStep = Math.max(1, Math.ceil(points.length / 6));

  return (
    <svg className="weight-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Weight over time">
      <line className="weight-chart-axis" x1={PAD_X} y1={HEIGHT - PAD_Y} x2={WIDTH - PAD_X} y2={HEIGHT - PAD_Y} />
      {points.length > 1 && <path className="weight-chart-line" d={linePath} />}
      {points.map((p, i) => (
        <circle key={p.date} className="weight-chart-dot" cx={xFor(i)} cy={yFor(p.weight)} r={4}>
          <title>{`${formatDate(p.date)}: ${p.weight} kg`}</title>
        </circle>
      ))}
      {points.map((p, i) =>
        i % labelStep === 0 || i === points.length - 1 ? (
          <text key={`label-${p.date}`} className="weight-chart-label" x={xFor(i)} y={HEIGHT - 6} textAnchor="middle">
            {formatDate(p.date)}
          </text>
        ) : null,
      )}
      <text className="weight-chart-label weight-chart-label-y" x={PAD_X} y={yFor(max) - 8} textAnchor="start">
        {max} kg
      </text>
      {max !== min && (
        <text className="weight-chart-label weight-chart-label-y" x={PAD_X} y={yFor(min) + 16} textAnchor="start">
          {min} kg
        </text>
      )}
    </svg>
  );
}
