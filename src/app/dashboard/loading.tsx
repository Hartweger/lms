export default function DashboardLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 animate-pulse">
      {/* Greeting */}
      <div className="mb-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-64" />
      </div>

      {/* Primary course card */}
      <div className="bg-white rounded-xl p-5 border-2 border-gray-100 mb-4">
        <div className="h-3 bg-gray-100 rounded w-32 mb-3" />
        <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-56 mb-4" />
        <div className="h-2 bg-gray-100 rounded-full w-full mb-2" />
        <div className="h-3 bg-gray-100 rounded w-24 mb-4" />
        <div className="h-12 bg-gray-200 rounded-lg w-full" />
      </div>

      {/* Secondary courses */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded w-28 mb-2" />
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-36 mb-1" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </div>
      </div>
    </div>
  );
}
