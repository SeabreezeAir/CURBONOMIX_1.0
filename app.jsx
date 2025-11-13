// src/App.jsx
import React from "react";
import { useState } from "react";

export default function App() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/curb?brand=${brand}&model=${model}`);
    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="app">
      <h1>Curbonomix RTU Curb Adapter Designer</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />
        <input
          type="text"
          placeholder="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
        <button type="submit">Generate Curb</button>
      </form>

      {result && (
        <div className="result">
          <h2>Generated Adapter</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
