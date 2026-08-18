import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const role = localStorage.getItem("role");
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");

    navigate("/");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const linkStyle = (path) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s ease",
    background: isActive(path)
      ? "linear-gradient(90deg, #2563eb, #7c3aed)"
      : "transparent",
    color: isActive(path) ? "white" : "#94a3b8",
    border: isActive(path)
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid transparent",
  });

  return (
    <div
      style={{
        width: "256px",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        background:
          "linear-gradient(180deg, #080b14 0%, #0f172a 100%)",
        color: "white",
        padding: "25px 18px",
        boxSizing: "border-box",
        borderRight: "1px solid #1e293b",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >

      {/* =========================
          LOGO
      ========================= */}

      <div
        style={{
          padding: "5px 10px 25px",
          borderBottom: "1px solid #1e293b",
          marginBottom: "20px",
        }}
      >

        <div
          style={{
            fontSize: "28px",
            fontWeight: "900",
            background:
              "linear-gradient(90deg, #60a5fa, #a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          SwipeX 🚀
        </div>

        <p
          style={{
            color: "#64748b",
            fontSize: "11px",
            marginTop: "5px",
            letterSpacing: "0.8px",
            textTransform: "uppercase",
          }}
        >
          AI Job Discovery
        </p>

      </div>


      {/* =========================
          USER ROLE
      ========================= */}

      <div
        style={{
          background: "#111827",
          border: "1px solid #1e293b",
          borderRadius: "10px",
          padding: "10px 12px",
          marginBottom: "18px",
        }}
      >

        <p
          style={{
            color: "#64748b",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
          }}
        >
          Logged in as
        </p>

        <p
          style={{
            color: "#e2e8f0",
            fontSize: "13px",
            fontWeight: "700",
            marginTop: "3px",
          }}
        >
          {role === "jobseeker"
            ? "👨‍💻 Job Seeker"
            : "🏢 Recruiter"}
        </p>

      </div>


      {/* =========================
          NAVIGATION
      ========================= */}

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          flex: 1,
          overflowY: "auto",
        }}
      >

        {/* JOB SEEKER */}

        {role === "jobseeker" && (
          <>
            <Link
              to="/dashboard"
              style={linkStyle("/dashboard")}
            >
              🏠
              <span>Dashboard</span>
            </Link>

            <Link
              to="/swipe"
              style={linkStyle("/swipe")}
            >
              💼
              <span>Swipe Jobs</span>
            </Link>

            <Link
              to="/jobs"
              style={linkStyle("/jobs")}
            >
              📋
              <span>All Jobs</span>
            </Link>

            <Link
              to="/applied"
              style={linkStyle("/applied")}
            >
              📄
              <span>Applied Jobs</span>
            </Link>

            <Link
              to="/saved"
              style={linkStyle("/saved")}
            >
              ❤️
              <span>Saved Jobs</span>
            </Link>

            <Link
              to="/notifications"
              style={linkStyle("/notifications")}
            >
              🔔
              <span>Notifications</span>
            </Link>

            <Link
              to="/recommendations"
              style={linkStyle("/recommendations")}
            >
              ⭐
              <span>AI Recommendations</span>
            </Link>

            <Link
              to="/profile"
              style={linkStyle("/profile")}
            >
              👤
              <span>Profile</span>
            </Link>

            <Link
              to="/companies"
              style={linkStyle("/companies")}
            >
              🏢
              <span>Companies</span>
            </Link>
          </>
        )}


        {/* RECRUITER */}

        {role === "recruiter" && (
          <>
            <Link
              to="/recruiter"
              style={linkStyle("/recruiter")}
            >
              🏢
              <span>Dashboard</span>
            </Link>

            <Link
              to="/post-job"
              style={linkStyle("/post-job")}
            >
              ➕
              <span>Post Job</span>
            </Link>

            <Link
              to="/my-jobs"
              style={linkStyle("/my-jobs")}
            >
              📋
              <span>My Jobs</span>
            </Link>

            <Link
              to="/applicants"
              style={linkStyle("/applicants")}
            >
              👥
              <span>Applicants</span>
            </Link>

            <Link
              to="/company-profile"
              style={linkStyle("/company-profile")}
            >
              🏢
              <span>Company Profile</span>
            </Link>

          </>
        )}

      </nav>


      {/* =========================
          LOGOUT
      ========================= */}

      <div
        style={{
          borderTop: "1px solid #1e293b",
          paddingTop: "15px",
        }}
      >

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 14px",
            background: "rgba(239,68,68,0.08)",
            color: "#f87171",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            textAlign: "left",
          }}
        >
          🚪
          <span>Logout</span>
        </button>

      </div>

    </div>
  );
}