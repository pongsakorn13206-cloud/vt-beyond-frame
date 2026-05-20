export default function LoadingSpinner({ text = 'กำลังโหลด...', size = 'md' }) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className={`${sizes[size]} border-indigo-500 border-t-transparent rounded-full animate-spin`}
      />
      {text && (
        <p className="text-slate-400 text-sm font-medium animate-pulse">{text}</p>
      )}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-slate-800/50 animate-pulse">
      <div className="h-48 bg-slate-700/50" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-slate-700/50 rounded w-3/4" />
        <div className="h-3 bg-slate-700/50 rounded w-1/2" />
      </div>
    </div>
  );
}
