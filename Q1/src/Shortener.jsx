import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api"; 

function Shortener() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!originalUrl) return;

    try {
      const res = await axios.post(`${API_BASE}/shorten`, { originalUrl });
      setShortUrl(`${API_BASE}/${res.data.shortId}`);
    } catch (err) {
      console.error("Error shortening URL", err);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="Enter your URL"
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          required
          style={{ padding: "10px", width: "300px" }}
        />
        <button type="submit" style={{ padding: "10px", marginLeft: "10px" }}>
          Shorten
        </button>
      </form>

      {shortUrl && (
        <div style={{ marginTop: "20px" }}>
          <p>Short URL:</p>
          <a href={shortUrl} target="_blank" rel="noopener noreferrer">
            {shortUrl}
          </a>
        </div>
      )}
    </div>
  );
}

export default Shortener;
