// Full-screen loading overlay used during auth checks or suspense states.
import React from "react";

export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f7fa",
      zIndex: 9999,
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh"
    }}>
      <div style={{
        background: "#fff",
        padding: 32,
        borderRadius: 16,
        boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <img src="/images/globe.png" alt="Loading" style={{ width: 48, height: 48, marginBottom: 16 }} />
        <div style={{ fontSize: 20, fontWeight: 600, color: "#6492BD" }}>Loading...</div>
      </div>
    </div>
  );
}
