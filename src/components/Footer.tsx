export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div>© {new Date().getFullYear()} Hartweger</div>
          <div className="flex gap-6">
            <a href="https://www.hartweger.rs/kontakt/" className="hover:text-plava">Kontakt</a>
            <a href="https://www.hartweger.rs/politika-privatnosti/" className="hover:text-plava">Politika privatnosti</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
