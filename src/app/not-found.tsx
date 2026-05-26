import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-extrabold text-plava mb-4">404</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Stranica nije pronađena
        </h1>
        <p className="text-gray-500 mb-8">
          Izgleda da ova stranica ne postoji ili je premeštena.
        </p>
        <Link
          href="/"
          className="inline-block bg-plava text-white px-6 py-3 rounded-lg font-bold hover:bg-plava-dark transition-colors"
        >
          Nazad na početnu
        </Link>
      </div>
    </div>
  );
}
