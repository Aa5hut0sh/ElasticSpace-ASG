"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "./../lib/api";
import { useAuth } from "./hooks";

type Machine = {
  id: string;
  instanceId: string;
  instanceIp: string;
  Status: string;
  startTime: string;
};

export default function Main() {
  const router = useRouter();
  const { isLoggedin, isLoading } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isLoading && !isLoggedin) {
      router.push("/login");
    } else if (isLoggedin) {
      fetchMachines();
    }
  }, [isLoggedin, isLoading, router]);

  const fetchMachines = async () => {
    try {
      const res = await api.get("/workspace/get-machines");
      if (res.data.success) {
        setMachines(res.data.machines);
      }
    } catch (err) {
      console.error("Failed to fetch machines", err);
    }
  };

  const handleStartMachine = async () => {
    setLoadingAction(true);
    setMessage("Attempting to start machine...");
    try {
      const res = await api.post("/workspace/start");
      if (res.status === 202) {
        setMessage(res.data.message); // The ASG scaling message
      } else if (res.status === 200) {
        setMessage("Machine started successfully!");
        fetchMachines(); // Refresh list
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Error starting machine.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleStopMachine = async (instanceId: string) => {
    if (!confirm("Are you sure you want to stop this machine?")) return;
    
    setLoadingAction(true);
    setMessage(`Stopping machine ${instanceId}...`);
    try {
      await api.post("/workspace/stop", { machineId: instanceId });
      setMessage("Machine stopped successfully.");
      fetchMachines(); // Refresh list
    } catch (err) {
      setMessage("Failed to stop machine.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("storage"));
    router.push("/login");
  };

  if (isLoading) return <div style={styles.centered}>Loading...</div>;
  if (!isLoggedin) return null;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Your Workspaces</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </header>

      <main style={styles.main}>
        <div style={styles.actionRow}>
          <button onClick={handleStartMachine} disabled={loadingAction} style={styles.startBtn}>
            {loadingAction ? "Processing..." : "+ Start New Machine"}
          </button>
          {message && <span style={styles.message}>{message}</span>}
        </div>

        <div style={styles.grid}>
          {machines.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No machines found. Start one above!</p>
          ) : (
            machines.map((machine) => (
              <div key={machine.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.machineId}>{machine.instanceId}</h3>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: machine.Status === "IN_USE" ? "#dcfce7" : "#fee2e2",
                    color: machine.Status === "IN_USE" ? "#166534" : "#991b1b"
                  }}>
                    {machine.Status}
                  </span>
                </div>
                <p style={styles.text}>IP: {machine.instanceIp || "Pending"}</p>
                <p style={styles.text}>Started: {new Date(machine.startTime).toLocaleString()}</p>
                
                <div style={styles.cardActions}>
                  {machine.Status === "IN_USE" && machine.instanceIp && (
                    <a 
                      href={`http://${machine.instanceIp}:8080`} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={styles.openBtn}
                    >
                      Open Workspace
                    </a>
                  )}
                  {machine.Status !== "DEAD" && (
                    <button 
                      onClick={() => handleStopMachine(machine.instanceId)} 
                      style={styles.stopBtn}
                      disabled={loadingAction}
                    >
                      Stop
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f9fafb", fontFamily: "sans-serif" },
  centered: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 2rem", backgroundColor: "white", borderBottom: "1px solid #e5e7eb" },
  title: { margin: 0, color: "#111827" },
  logoutBtn: { padding: "0.5rem 1rem",color: "black", backgroundColor: "transparent", border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer" },
  main: { padding: "2rem", maxWidth: "1200px", margin: "0 auto" },
  actionRow: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" },
  startBtn: { padding: "0.75rem 1.5rem", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" },
  message: { color: "#4b5563", fontSize: "0.9rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" },
  card: { backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  machineId: { margin: 0, fontSize: "1.1rem", color: "#1f2937", overflow: "hidden", textOverflow: "ellipsis" },
  badge: { padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "bold" },
  text: { margin: "0.5rem 0", color: "#4b5563", fontSize: "0.9rem" },
  cardActions: { display: "flex", gap: "0.5rem", marginTop: "1.5rem" },
  openBtn: { flex: 1, textAlign: "center" as const, padding: "0.5rem", backgroundColor: "#3b82f6", color: "white", textDecoration: "none", borderRadius: "4px", fontSize: "0.9rem" },
  stopBtn: { flex: 1, padding: "0.5rem", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.9rem" }
};