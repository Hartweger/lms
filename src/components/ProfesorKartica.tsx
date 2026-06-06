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
    <div className="border border-gray-200 rounded-xl p-4 md:rounded-2xl md:p-6 text-center bg-white hover:border-plava hover:shadow-md transition-all">
      <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-plava-light flex items-center justify-center mx-auto mb-3 md:mb-4">
        <span className="text-plava text-base md:text-xl font-bold">
          {getInitials(name)}
        </span>
      </div>
      <h3 className="text-sm md:text-lg font-montserrat font-bold text-gray-900">{name}</h3>
      <p className="text-plava text-xs md:text-sm font-medium mt-0.5 md:mt-1">{role}</p>
      <p className="text-gray-600 text-xs md:text-sm mt-2 md:mt-3 hidden sm:block">{bio}</p>
    </div>
  );
}
