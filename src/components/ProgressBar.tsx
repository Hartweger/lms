export default function ProgressBar({
  progress,
  className = "",
}: {
  progress: number;
  className?: string;
}) {
  return (
    <div className={`bg-gray-100 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="bg-plava h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
