import { useState } from "react";
import axios from "../api";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("jobseeker");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      alert("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      alert("Password must contain at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      await axios.post("register/", {
        username,
        email,
        password,
        role,
      });

      alert("🎉 Account created successfully!");

      navigate("/");

    } catch (err) {
      console.log("REGISTER ERROR:", err.response?.data || err);

      const errorData = err.response?.data;

      if (errorData) {
        alert(JSON.stringify(errorData));
      } else {
        alert("Registration failed. Please try again.");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #080b14 0%, #111827 50%, #1e1b4b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        boxSizing: "border-box",
      }}
    >

      {/* MAIN CARD */}

      <div
        style={{
          width: "100%",
          maxWidth: "950px",
          minHeight: "620px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid #263247",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
        }}
      >

        {/* =========================
            LEFT SIDE
        ========================= */}

        <div
          style={{
            padding: "55px 45px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background:
              "linear-gradient(145deg, #111827 0%, #172554 100%)",
          }}
        >

          <div
            style={{
              fontSize: "34px",
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
              fontWeight: "800",
              marginBottom: "18px",
            }}
          >
            Your next opportunity
            <br />
            starts here.
          </h1>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "15px",
              lineHeight: "1.7",
              maxWidth: "380px",
            }}
          >
            Create your SwipeX account and discover smarter,
            AI-powered job opportunities tailored to you.
          </p>

          {/* FEATURES */}

          <div
            style={{
              marginTop: "35px",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >

            <Feature
              icon="🤖"
              title="AI-Powered Matching"
              text="Find jobs that match your skills."
            />

            <Feature
              icon="📊"
              title="Smart ATS Analysis"
              text="Check how well your resume matches."
            />

            <Feature
              icon="🔔"
              title="Smart Notifications"
              text="Never miss relevant opportunities."
            />

          </div>

        </div>


        {/* =========================
            RIGHT SIDE
        ========================= */}

        <div
          style={{
            padding: "45px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: "#0f172a",
          }}
        >

          <div style={{ marginBottom: "25px" }}>

            <h2
              style={{
                color: "white",
                fontSize: "28px",
                fontWeight: "800",
                marginBottom: "7px",
              }}
            >
              Create your account
            </h2>

            <p
              style={{
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Join SwipeX and start finding better opportunities.
            </p>

          </div>


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


          {/* EMAIL */}

          <label style={labelStyle}>
            Email Address
          </label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />


          {/* ROLE */}

          <label style={labelStyle}>
            I want to join as
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "17px",
            }}
          >

            <RoleButton
              active={role === "jobseeker"}
              onClick={() => setRole("jobseeker")}
              icon="👨‍💻"
              text="Job Seeker"
            />

            <RoleButton
              active={role === "recruiter"}
              onClick={() => setRole("recruiter")}
              icon="🏢"
              text="Recruiter"
            />

          </div>


          {/* PASSWORD */}

          <label style={labelStyle}>
            Password
          </label>

          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />


          {/* CONFIRM PASSWORD */}

          <label style={labelStyle}>
            Confirm Password
          </label>

          <input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />


          {/* REGISTER BUTTON */}

          <button
            onClick={handleRegister}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "8px",
              border: "none",
              borderRadius: "11px",
              background:
                "linear-gradient(90deg, #2563eb, #7c3aed)",
              color: "white",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow:
                "0 10px 25px rgba(37,99,235,0.25)",
            }}
          >
            {loading ? "Creating Account..." : "Create Account →"}
          </button>


          {/* LOGIN */}

          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              fontSize: "14px",
              marginTop: "22px",
            }}
          >
            Already have an account?{" "}

            <Link
              to="/"
              style={{
                color: "#60a5fa",
                fontWeight: "700",
                textDecoration: "none",
              }}
            >
              Login
            </Link>
          </p>

        </div>

      </div>

    </div>
  );
}


/* =========================
   SMALL COMPONENTS
========================= */

function Feature({ icon, title, text }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "13px",
      }}
    >

      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "11px",
          background: "rgba(37,99,235,0.12)",
          border: "1px solid rgba(96,165,250,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "19px",
        }}
      >
        {icon}
      </div>

      <div>
        <p
          style={{
            color: "#e2e8f0",
            fontWeight: "700",
            fontSize: "14px",
            margin: 0,
          }}
        >
          {title}
        </p>

        <p
          style={{
            color: "#64748b",
            fontSize: "12px",
            marginTop: "3px",
          }}
        >
          {text}
        </p>
      </div>

    </div>
  );
}


function RoleButton({
  active,
  onClick,
  icon,
  text,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "12px",
        borderRadius: "10px",
        border: active
          ? "1px solid #3b82f6"
          : "1px solid #263247",
        background: active
          ? "rgba(37,99,235,0.15)"
          : "#111827",
        color: active
          ? "#60a5fa"
          : "#94a3b8",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "13px",
      }}
    >
      {icon} {text}
    </button>
  );
}


const labelStyle = {
  color: "#cbd5e1",
  fontSize: "13px",
  fontWeight: "600",
  marginBottom: "7px",
};


const inputStyle = {
  width: "100%",
  padding: "12px 13px",
  marginBottom: "15px",
  boxSizing: "border-box",
  background: "#111827",
  border: "1px solid #263247",
  borderRadius: "10px",
  color: "#f8fafc",
  outline: "none",
  fontSize: "14px",
};


export default Register;