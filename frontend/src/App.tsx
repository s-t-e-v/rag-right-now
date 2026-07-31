import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Corpus from "./pages/Corpus";
import Configuration from "./pages/Configuration";
import Interview from "./pages/Interview";
import Results from "./pages/Results";

// Routes: cf. section 7 (Pages frontend) du plan
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/corpus" element={<Corpus />} />
        <Route path="/interviews/new" element={<Configuration />} />
        <Route path="/interviews/:id" element={<Interview />} />
        <Route path="/interviews/:id/results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  );
}
