import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import './App.css';
import styles from '../styles';


export default function RedirectHandler() {
  const { shortCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.location.href = `${API}/${shortCode}`;
  }, [shortCode]);

  return <p style={styles.redirecting}>Redirecting...</p>;
}