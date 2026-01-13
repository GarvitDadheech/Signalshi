# Signalshi Landing Page

A visually stunning, modern SaaS landing page for Signalshi - a real-time market intelligence platform.

## Features

- 🎨 **Dark mode first** design with gradient-heavy aesthetics
- ✨ **Glassmorphism cards** for premium feel
- 🎭 **Smooth scroll-triggered animations** using Framer Motion
- 💫 **Micro-interactions** on hover
- 📱 **Fully responsive** design
- 🚀 **Production-ready** code

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Framer Motion** - Animations
- **Vite** - Build tool

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
landing-page/
├── src/
│   ├── components/        # React components
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── Problem.tsx
│   │   ├── Solution.tsx
│   │   ├── Features.tsx
│   │   ├── LiveDemo.tsx
│   │   ├── WhoItsFor.tsx
│   │   ├── WhyDifferent.tsx
│   │   ├── FinalCTA.tsx
│   │   └── Footer.tsx
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/
│   └── logo.png           # Signalshi logo
└── index.html
```

## Sections

1. **Hero** - Above the fold with animated chart lines
2. **Problem** - Four pain points traders face
3. **Solution** - How Signalshi works in 3 steps
4. **Features** - Four key features with glass cards
5. **Live Demo** - Mock Telegram messages and sentiment analysis
6. **Who It's For** - Target personas
7. **Why Different** - Comparison table
8. **Final CTA** - Call to action with animated glow
9. **Footer** - Links and social media

## Design Notes

- Uses gradient colors: blue → purple → cyan
- Glassmorphism effect on cards (`glass` utility class)
- Subtle background noise and grid patterns
- Smooth animations that feel premium, not overwhelming
- All animations are scroll-triggered for performance

## Customization

### Colors

Edit gradient colors in `src/index.css`:
```css
.gradient-text {
  @apply bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent;
}
```

### Animations

Adjust animation timing in component files using Framer Motion props:
```tsx
initial={{ opacity: 0, y: 30 }}
animate={isInView ? { opacity: 1, y: 0 } : {}}
transition={{ duration: 0.6 }}
```

## License

Private - Signalshi
