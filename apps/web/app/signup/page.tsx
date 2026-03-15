"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/user/signup", formData);
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        window.dispatchEvent(new Event("storage")); // Trigger useAuth update
        router.push("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create an Account</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={styles.input}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={styles.input}
            required
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
        <p style={styles.switchText}>
          Already have an account? <a href="/login" style={styles.link}>Login</a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f3f4f6", fontFamily: "sans-serif" },
  card: { backgroundColor: "white", padding: "2rem", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px" },
  title: { textAlign: "center" as const, marginBottom: "1.5rem", color: "#1f2937" },
  form: { display: "flex", flexDirection: "column" as const, gap: "1rem" },
  input: { padding: "0.75rem", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "1rem" },
  button: { padding: "0.75rem", borderRadius: "4px", border: "none", backgroundColor: "#3b82f6", color: "white", fontSize: "1rem", cursor: "pointer", fontWeight: "bold" },
  error: { color: "#ef4444", fontSize: "0.875rem", textAlign: "center" as const, marginBottom: "1rem" },
  switchText: { textAlign: "center" as const, marginTop: "1.5rem", fontSize: "0.875rem", color: "#4b5563" },
  link: { color: "#3b82f6", textDecoration: "none" }
};