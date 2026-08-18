import { useState } from "react";
import axios from "../api";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [role, setRole] = useState("jobseeker");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");

    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("login/", {
        username,
        password,
      });

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      const userRes = await axios.get("me/", {
        headers: {
          Authorization: `Bearer ${res.data.access}`,
        },
      });

      localStorage.setItem("role", userRes.data.role);

      if (userRes.data.role === "jobseeker") {
        navigate("/dashboard");
      } else {
        navigate("/recruiter");
      }

    } catch (err) {
      console.log(err.response?.data);
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #050816 0%, #0f172a 50%, #111827 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        position: "relative",
        overflow: "hidden",
      }}
    >

      {/* Background Glow */}

      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          background: "#2563eb",
          opacity: "0.15",
          filter: "blur(120px)",
          borderRadius: "50%",
          top: "-100px",
          left: "-100px",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: "350px",
          height: "350px",
          background: "#7c3aed",
          opacity: "0.15",
          filter: "blur(120px)",
          borderRadius: "50%",
          bottom: "-100px",
          right: "-100px",
        }}
      />


      {/* MAIN CONTAINER */}

      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          minHeight: "600px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "rgba(15, 23, 42, 0.88)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
          backdropFilter: "blur(20px)",
          position: "relative",
          zIndex: 2,
        }}
      >

        {/* LEFT SIDE */}

        <div
          style={{
            padding: "55px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background:
              "linear-gradient(145deg, rgba(37,99,235,0.18), rgba(124,58,237,0.12))",
          }}
        >

          <div
            style={{
              fontSize: "42px",
              fontWeight: "900",
              background:
                "linear-gradient(90deg, #60a5fa, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "15px",
            }}
          >
            SwipeX 🚀
          </div>

          <h1
            style={{
              color: "white",
              fontSize: "38px",
              lineHeight: "1.15",
              marginBottom: "20px",
            }}
          >
            Find jobs that
            <br />
            <span style={{ color: "#60a5fa" }}>
              match your potential.
            </span>
          </h1>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "16px",
              lineHeight: "1.7",
              maxWidth: "400px",
            }}
          >
            SwipeX uses AI-powered job discovery and resume analysis
            to help you find opportunities that fit your skills.
          </p>


          {/* FEATURES */}

          <div style={{ marginTop: "35px" }}>

            <div style={featureStyle}>
              <span>🤖</span>
              <div>
                <b>AI-Powered Matching</b>
                <p>Discover jobs that match your skills.</p>
              </div>
            </div>

            <div style={featureStyle}>
              <span>📊</span>
              <div>
                <b>ATS Resume Analysis</b>
                <p>Check your resume compatibility instantly.</p>
              </div>
            </div>

            <div style={featureStyle}>
              <span>🎯</span>
              <div>
                <b>Smart Recommendations</b>
                <p>Get personalized opportunities.</p>
              </div>
            </div>

          </div>

        </div>


        {/* RIGHT SIDE */}

        <div
          style={{
            background: "#0f172a",
            padding: "55px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >

          <h2
            style={{
              color: "white",
              fontSize: "30px",
              fontWeight: "800",
              marginBottom: "8px",
            }}
          >
            Welcome Back 👋
          </h2>

          <p
            style={{
              color: "#64748b",
              marginBottom: "30px",
            }}
          >
            Login to continue your career journey.
          </p>


          {/* ERROR */}

          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#fca5a5",
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "18px",
                fontSize: "14px",
              }}
            >
              ⚠️ {error}
            </div>
          )}


          {/* USERNAME */}

          <label style={labelStyle}>
            Username
          </label>

          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />


          {/* PASSWORD */}

          <label style={labelStyle}>
            Password
          </label>

          <div style={{ position: "relative" }}>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                ...inputStyle,
                marginBottom: "22px",
                paddingRight: "55px",
              }}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              style={{
                position: "absolute",
                right: "12px",
                top: "12px",
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>

          </div>


          {/* ROLE */}

          <label style={labelStyle}>
            Login As
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "25px",
            }}
          >

            <button
              type="button"
              onClick={() => setRole("jobseeker")}
              style={{
                ...roleButtonStyle,
                background:
                  role === "jobseeker"
                    ? "rgba(37,99,235,0.2)"
                    : "#111827",
                border:
                  role === "jobseeker"
                    ? "1px solid #3b82f6"
                    : "1px solid #334155",
                color:
                  role === "jobseeker"
                    ? "#60a5fa"
                    : "#94a3b8",
              }}
            >
              👨‍💻 Job Seeker
            </button>

            <button
              type="button"
              onClick={() => setRole("recruiter")}
              style={{
                ...roleButtonStyle,
                background:
                  role === "recruiter"
                    ? "rgba(124,58,237,0.2)"
                    : "#111827",
                border:
                  role === "recruiter"
                    ? "1px solid #8b5cf6"
                    : "1px solid #334155",
                color:
                  role === "recruiter"
                    ? "#a78bfa"
                    : "#94a3b8",
              }}
            >
              🏢 Recruiter
            </button>

          </div>


          {/* LOGIN BUTTON */}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              background: loading
                ? "#334155"
                : "linear-gradient(90deg, #2563eb, #7c3aed)",
              color: "white",
              border: "none",
              borderRadius: "11px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              boxShadow:
                "0 10px 25px rgba(37,99,235,0.25)",
            }}
          >
            {loading ? "Signing in..." : "Login →"}
          </button>


          {/* REGISTER */}

          <div
            style={{
              textAlign: "center",
              marginTop: "25px",
            }}
          >

            <p
              style={{
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              New to SwipeX?{" "}

              <Link
                to="/register"
                style={{
                  color: "#60a5fa",
                  fontWeight: "700",
                  textDecoration: "none",
                }}
              >
                Create Account
              </Link>
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================
   STYLES
========================= */

const labelStyle = {
  color: "#cbd5e1",
  fontSize: "14px",
  fontWeight: "600",
  marginBottom: "8px",
  display: "block",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px",
  marginBottom: "18px",
  borderRadius: "10px",
  border: "1px solid #334155",
  background: "#111827",
  color: "white",
  outline: "none",
  fontSize: "15px",
};

const roleButtonStyle = {
  padding: "12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
};

const featureStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginBottom: "20px",
  color: "#e2e8f0",
};

export default Login;