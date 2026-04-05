export default function Loading() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="animate-pulse space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}