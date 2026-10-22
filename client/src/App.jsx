import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/public/HomePage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}
