import { MotionConfig } from 'framer-motion';
import SaveTheDatePage from './pages/SaveTheDatePage';

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SaveTheDatePage />
    </MotionConfig>
  );
}

export default App;
