// App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

const styles = {
  wrapper: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f1f1f'
  },
  container: {
    width: '100%',
    maxWidth: '800px',
    background: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  heading: {
    fontSize: '28px',
    marginBottom: '20px',
    textAlign: 'center',
    color: 'black'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px'
  },
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px',
    backgroundColor: '#fff',
    color: '#000'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  results: {
    marginTop: '30px',
    width: '100%'
  },
  resultItem: {
    backgroundColor: '#f3f4f6',
    padding: '10px',
    marginTop: '8px',
    borderRadius: '4px'
  },
  error: {
    color: 'red'
  },
  statItem: {
    backgroundColor: '#f3f4f6',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '12px'
  },
  redirecting: {
    textAlign: 'center',
    marginTop: '40px',
    fontSize: '18px'
  }
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/shorten" />} />
        <Route path="/shorten" element={<ShortenerPage />} />
        <Route path="/stats" element={<StatisticsPage />} />
        <Route path="/:shortCode" element={<RedirectHandler />} />
      </Routes>
    </Router>
  );
}

function ShortenerPage() {
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

function StatisticsPage() {
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    axios.get(`${API}/api/urls`).then((res) => setUrls(res.data));
  }, []);

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.heading}>URL Statistics</h1>
        {urls.map((u, i) => (
          <div key={i} style={styles.statItem}>
            <p>Short: <a href={`${API}/${u.shortCode}`}>{API}/{u.shortCode}</a></p>
            <p>Original: {u.originalUrl}</p>
            <p>Expires at: {new Date(u.expiry).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RedirectHandler() {
  const { shortCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.location.href = `${API}/${shortCode}`;
  }, [shortCode]);

  return <p style={styles.redirecting}>Redirecting...</p>;
}

export default App;
