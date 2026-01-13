import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 py-6 sm:py-4 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Left: Brand */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="text-base sm:text-lg font-bold text-black">Signalshi</span>
            <span className="hidden sm:inline text-gray-400">•</span>
            <span className="text-xs sm:text-sm text-gray-600">
              Built for traders who value clarity
            </span>
          </div>

          {/* Right: Social Icons */}
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-black transition-colors"
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </motion.a>
            <motion.a
              href="https://telegram.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-black transition-colors"
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.84 8.678c-.135.608-.481.758-.978.462l-2.7-1.99-1.302 1.253c-.15.15-.276.276-.566.276l.2-2.846 5.001-4.52c.217-.19-.048-.295-.335-.104l-6.18 3.896-2.664-.833c-.578-.18-.592-.578.12-.88l10.398-4.01c.49-.18.92.13.76.67z" />
              </svg>
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  );
}
