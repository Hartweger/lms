function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfesorKartica({
  name,
  role,
  bio,
}: {
  name: string;
  role: string;
  bio: string;
}) {
  return (
    <div className="border border-gray-200 rounded-2xl p-6 text-center bg-white hover:border-plava hover:shadow-md transition-all">
      <div className="w-20 h-20 rounded-full bg-plava-light flex items-center justify-center mx-auto mb-4">
        <span className="text-plava text-xl font-bold">
          {getInitials(name)}
        </span>
      </div>
      <h3 className="text-lg font-heading font-bold text-gray-900">{name}</h3>
      <p className="text-plava text-sm font-medium mt-1">{role}</p>
      <p className="text-gray-600 text-sm mt-3">{bio}</p>
    </div>
  );
}
