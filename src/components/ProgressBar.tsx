interface Props {
  percent: number;
  label: string;
}

export function ProgressBar({ percent, label }: Props) {
  return (
    <div className="progress">
      <div
        className="progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="progress-text">{percent} %</span>
    </div>
  );
}
