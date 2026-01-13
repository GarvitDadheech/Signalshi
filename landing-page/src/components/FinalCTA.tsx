import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function FinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section ref={ref} className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white relative">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-black px-4">
            Stop guessing.
            <br />
            <span className="text-gray-600">Start understanding.</span>
          </h2>

          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 font-light max-w-xl mx-auto px-4">
            Join thousands of traders saving hours every day
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
            <motion.a
              id="telegram"
              href="#telegram"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-black text-white rounded-lg font-medium text-sm sm:text-base hover:bg-gray-900 transition-all shadow-lg text-center"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Join Telegram
            </motion.a>
            <motion.a
              id="extension"
              href="#extension"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 border-2 border-black text-black rounded-lg font-medium text-sm sm:text-base hover:bg-black hover:text-white transition-all text-center"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Install Extension
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
