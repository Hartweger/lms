export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      {/* Greeting */}
      <div className="mb-8">
        <div className="h-7 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-64" />
      </div>

      {/* Primary course card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8 sm:flex sm:items-center sm:gap-6">
        <div className="flex-1">
          <div className="h-3 bg-gray-100 rounded w-32 mb-3" />
          <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-56 mb-4" />
          <div className="h-2 bg-gray-100 rounded-full w-full mb-2" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </div>
        <div className="mt-5 sm:mt-0 sm:w-56 shrink-0">
          <div className="h-12 bg-gray-200 rounded-xl w-full" />
        </div>
      </div>

      {/* Secondary courses */}
      <div>
        <div className="h-3 bg-gray-100 rounded w-28 mb-3" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-36 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-24 mb-3" />
            <div className="h-2 bg-gray-100 rounded-full w-full" />
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-36 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-24 mb-3" />
            <div className="h-2 bg-gray-100 rounded-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
