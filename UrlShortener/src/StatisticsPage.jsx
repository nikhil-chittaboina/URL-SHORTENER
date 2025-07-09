import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";

import './App.css';
export default function StatisticsPage() {
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