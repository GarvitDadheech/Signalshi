import { motion } from 'framer-motion';
import { AuroraBackground } from './ui/aurora-background';

export default function Hero() {
  return (
    <AuroraBackground className="min-h-[85vh] sm:min-h-[90vh] w-full flex items-center justify-center pt-16 sm:pt-20 pb-12 sm:pb-16" showRadialGradient={false}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="relative flex flex-col gap-4 sm:gap-6 items-center justify-center text-center"
        >
          {/* Main Heading - Centered */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-black leading-tight px-2">
            Understand the market
            <br />
            <span className="text-gray-600">in seconds, not hours.</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-black max-w-3xl mx-auto font-semibold px-4">
            Real-time Kalshi market intelligence. Instant research. Clear sentiment.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-2 sm:mt-4 w-full sm:w-auto px-4">
            <motion.a
              href="#telegram"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-black text-white rounded-lg font-medium text-sm sm:text-base hover:bg-gray-900 transition-all shadow-lg text-center"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Join Telegram Bot
            </motion.a>
            <motion.a
              href="#extension"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 border-2 border-black text-black rounded-lg font-medium text-sm sm:text-base hover:bg-black hover:text-white transition-all bg-white/80 backdrop-blur-sm text-center"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Extension
            </motion.a>
          </div>
        </motion.div>
      </div>
    </AuroraBackground>
  );
}
