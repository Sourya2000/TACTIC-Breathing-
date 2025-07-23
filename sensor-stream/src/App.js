import React from "react";
import { Routes, Route } from "react-router-dom";
import SensorPage from "./SensorPage";
import Signup from "./signup";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Signup />} />
      <Route path="/main" element={<SensorPage />} />
    </Routes>
  );
};

export default App;
