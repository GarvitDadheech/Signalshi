import Hero from './components/Hero';
import Features from './components/Features';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <FinalCTA />
      <Footer />
    </div>
  );
}

export default App;
