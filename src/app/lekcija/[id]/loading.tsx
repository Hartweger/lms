export default function LekcijaLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-4 animate-pulse">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-gray-200 rounded w-28" />
        <div className="h-4 bg-gray-100 rounded w-12" />
      </div>

      {/* Title */}
      <div className="h-8 bg-gray-200 rounded w-72 mb-6" />

      {/* Video placeholder */}
      <div className="w-full bg-gray-100 rounded-xl" style={{ paddingBottom: "56.25%" }} />

      {/* Content lines */}
      <div className="mt-6 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
        <div className="h-4 bg-gray-100 rounded w-4/6" />
      </div>

      {/* Exercise cards */}
      <div className="mt-8 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-16 mb-3" />
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="h-4 bg-gray-200 rounded w-40" />
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="h-4 bg-gray-200 rounded w-48" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
        <div className="flex-1 h-12 bg-gray-100 rounded-lg" />
        <div className="flex-1 h-12 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
