import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import StockOpname from './pages/StockOpname';
import BrokenBook from './pages/BrokenBook';
import BarcodeScanner from './pages/BarcodeScanner';
import BrokenBookScanner from './pages/BrokenBookScanner';
import RentComputer from './pages/RentComputer';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stock-opname" element={<StockOpname />} />
          <Route path="/stock-opname/scan" element={<BarcodeScanner />} />
          <Route path="/broken-book" element={<BrokenBook />} />
          <Route path="/broken-book-scanner" element={<BrokenBookScanner />} />
          <Route path="/rent-computer" element={<RentComputer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
