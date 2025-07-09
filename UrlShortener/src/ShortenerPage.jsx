import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import './App.css';
import styles from '../styles';
export default function ShortenerPage() {
  const [inputs, setInputs] = useState([
    { originalUrl: "", validity: "", shortcode: "" },
  ]);
  const [results, setResults] = useState([]);

  const handleChange = (index, field, value) => {
    const updated = [...inputs];
    updated[index][field] = value;
    setInputs(updated);
  };

  const addInput = () => {
    if (inputs.length < 5) {
      setInputs([...inputs, { originalUrl: "", validity: "", shortcode: "" }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newResults = [];
    for (const input of inputs) {
      try {
        if (!/^https?:\/\//.test(input.originalUrl)) throw new Error("Invalid URL");
        const payload = {
          originalUrl: input.originalUrl,
          validity: parseInt(input.validity) || 30,
          shortcode: input.shortcode.trim() || undefined,
        };
        const res = await axios.post(`${API}/api/shorten`, payload);
        newResults.push({ ...payload, shortId: res.data.shortId });
      } catch (err) {
        newResults.push({ ...input, error: err.response?.data?.error || err.message });
      }
    }
    setResults(newResults);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.heading}>URL Shortener</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          {inputs.map((input, index) => (
            <div key={index} style={styles.inputGroup}>
              <input
                type="url"
                placeholder="Original URL"
                value={input.originalUrl}
                onChange={(e) => handleChange(index, "originalUrl", e.target.value)}
                required
                style={styles.input}
              />
              <input
                type="number"
                placeholder="Validity (minutes)"
                value={input.validity}
                onChange={(e) => handleChange(index, "validity", e.target.value)}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Custom shortcode (optional)"
                value={input.shortcode}
                onChange={(e) => handleChange(index, "shortcode", e.target.value)}
                style={styles.input}
              />
            </div>
          ))}
          <div style={styles.buttonGroup}>
            <button type="button" onClick={addInput} style={styles.button}>Add More</button>
            <button type="submit" style={styles.button}>Shorten</button>
          </div>
        </form>
        <div style={styles.results}>
          <h2>Results</h2>
          {results.map((r, i) => (
            <div key={i} style={styles.resultItem}>
              {r.error ? (
                <p style={styles.error}>Error: {r.error}</p>
              ) : (
                <p>
                  <a href={`${API}/${r.shortId}`} target="_blank" rel="noopener noreferrer">
                    {API}/{r.shortId}
                  </a> - Expires in: {r.validity || 30} min
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}