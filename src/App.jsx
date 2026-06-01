import { MotionConfig } from 'framer-motion';
import { Routes, Route } from 'react-router';
import SaveTheDatePage from './pages/SaveTheDatePage';

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route path="/i/:id" element={<SaveTheDatePage />} />
        <Route path="/*" element={<SaveTheDatePage />} />
      </Routes>
    </MotionConfig>
  );
}

export default App;
