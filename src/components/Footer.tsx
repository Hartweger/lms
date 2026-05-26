export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div>© {new Date().getFullYear()} Hartweger</div>
          <div>
            <a href="mailto:info@hartweger.rs" className="hover:text-plava">Kontakt</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
