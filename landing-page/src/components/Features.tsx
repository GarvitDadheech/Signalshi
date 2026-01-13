import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { DottedGlowBackground } from './ui/dotted-glow-background';

const features = [
  {
    title: 'Telegram Smart Alerts',
    description: 'Real-time alerts explaining why Kalshi markets moved, so you can react instantly with context.',
  },
  {
    title: 'AI Market Research',
    description: 'Instant, plain-English analysis for Kalshi event markets. Know the drivers before you place a bet.',
  },
  {
    title: 'Browser Extension',
    description: 'See live Kalshi market analysis directly on the market page. No tab switching, no distractions.',
  },
  {
    title: 'Sentiment Analysis',
    description: 'Bullish or bearish in seconds. Signalshi summarizes trader sentiment around each Kalshi market so you don\'t have to read everything.',
  }
];

export default function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section id="features" ref={ref} className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-2 px-4">
            Everything you need
          </h2>
          <p className="text-gray-600 text-sm sm:text-base px-4">Powerful tools to make smarter trading decisions</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative p-6 sm:p-8 border border-gray-200 rounded-lg hover:border-black transition-all bg-white group"
              whileHover={{ y: -3 }}
            >
              <DottedGlowBackground
                className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                opacity={0.15}
                gap={15}
                radius={1}
              />
              <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 text-black relative z-10">{feature.title}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed relative z-10">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
