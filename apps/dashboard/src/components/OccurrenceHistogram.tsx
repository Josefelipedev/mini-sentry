'use client';

interface DataPoint {
  date: string;
  count: number;
}

interface Props {
  data: DataPoint[];
}

export function OccurrenceHistogram({ data }: Props) {
  if (data.length === 0) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const W = 600;
  const H = 64;
  const barW = Math.floor(W / data.length) - 1;

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H + 16}`}
        className="w-full"
        aria-label="Occurrence histogram"
        role="img"
      >
        {data.map((point, i) => {
          const barH = point.count > 0 ? Math.max(Math.round((point.count / maxCount) * H), 3) : 0;
          const x = i * (barW + 1);
          const y = H - barH;

          return (
            <g key={point.date}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                fill={barH > 0 ? '#ef4444' : '#374151'}
                rx={1}
                className="transition-opacity hover:opacity-80"
              >
                <title>{`${point.date}: ${point.count} occurrence${point.count !== 1 ? 's' : ''}`}</title>
              </rect>
            </g>
          );
        })}

        {/* First and last date labels */}
        {data[0] && (
          <text x={0} y={H + 14} fontSize={10} fill="#6b7280">
            {data[0].date}
          </text>
        )}
        {data[data.length - 1] && (
          <text x={W} y={H + 14} fontSize={10} fill="#6b7280" textAnchor="end">
            {data[data.length - 1]!.date}
          </text>
        )}
      </svg>
      <figcaption className="text-xs text-gray-600 mt-1">
        Occurrences per day — last 30 days
      </figcaption>
    </figure>
  );
}
