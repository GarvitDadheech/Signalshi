import { motion } from 'framer-motion';

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <span className="text-lg sm:text-xl font-bold text-black">Signalshi</span>
          </div>
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <a href="#features" className="text-gray-600 hover:text-black transition-colors text-sm font-medium">Features</a>
            <a href="#demo" className="text-gray-600 hover:text-black transition-colors text-sm font-medium">Demo</a>
          </div>
          <div className="flex items-center">
            <a
              href="#telegram"
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-all text-xs sm:text-sm font-medium"
            >
              Join
            </a>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
