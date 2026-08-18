import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();

  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const [stats, setStats] = useState({
    total_jobs: 0,
    applied_jobs: 0,
    saved_jobs: 0,
    shortlisted: 0,
    interviews: 0,
    rejected: 0,
    pending: 0,
  });

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");

    navigate("/");
  };

  /* =========================
     RECOMMENDED JOBS
  ========================= */

  useEffect(() => {
    const fetchRecommendedJobs = async () => {
      try {
        const res = await axios.get("recommended-jobs/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        });

        setRecommendedJobs(res.data);
      } catch (err) {
        console.log("Recommendation Error:", err);
      }
    };

    fetchRecommendedJobs();
  }, []);

  /* =========================
     DASHBOARD STATS
  ========================= */

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem("access");

        const res = await axios.get("dashboard-stats/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("DASHBOARD STATS:", res.data);

        setStats(res.data);
      } catch (err) {
        console.log(
          "DASHBOARD STATS ERROR:",
          err.response?.status,
          err.response?.data
        );
      }
    };

    fetchDashboardStats();
  }, []);

  /* =========================
     ANALYTICS DATA
  ========================= */

  const chartData = [
    {
      status: "Pending",
      count: stats.pending,
    },
    {
      status: "Shortlisted",
      count: stats.shortlisted,
    },
    {
      status: "Interview",
      count: stats.interviews,
    },
    {
      status: "Rejected",
      count: stats.rejected,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #080b14 0%, #101827 50%, #0b1120 100%)",
        color: "#f8fafc",
      }}
    >

      {/* SIDEBAR */}

      <Sidebar />


      {/* MAIN CONTENT */}

      <div
        style={{
          marginLeft: "256px",
          flex: 1,
          padding: "35px",
          maxWidth: "1500px",
        }}
      >

        {/* =========================
            TOP BAR
        ========================= */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "35px",
          }}
        >

          <div>

            <p
              style={{
                color: "#60a5fa",
                fontSize: "13px",
                fontWeight: "700",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              SwipeX AI
            </p>

            <h1
              style={{
                fontSize: "34px",
                fontWeight: "800",
                margin: 0,
              }}
            >
              Welcome back 👋
            </h1>

            <p
              style={{
                color: "#94a3b8",
                marginTop: "7px",
              }}
            >
              Here's an overview of your job search.
            </p>

          </div>


          <button
            onClick={handleLogout}
            style={{
              background: "#1e293b",
              color: "#f87171",
              border: "1px solid #334155",
              padding: "10px 18px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Logout
          </button>

        </div>


        {/* =========================
            STAT CARDS
        ========================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "18px",
            marginBottom: "25px",
          }}
        >

          <StatCard
            icon="💼"
            title="Jobs Available"
            value={stats.total_jobs}
            subtitle="Current opportunities"
            color="#3b82f6"
          />

          <StatCard
            icon="📄"
            title="Applied Jobs"
            value={stats.applied_jobs}
            subtitle="Applications sent"
            color="#8b5cf6"
          />

          <StatCard
            icon="❤️"
            title="Saved Jobs"
            value={stats.saved_jobs}
            subtitle="Jobs saved for later"
            color="#ec4899"
          />

          <StatCard
            icon="🎯"
            title="Shortlisted"
            value={stats.shortlisted}
            subtitle="Selected by recruiters"
            color="#22c55e"
          />

        </div>


        {/* =========================
            SECONDARY STATS
        ========================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "15px",
            marginBottom: "25px",
          }}
        >

          <MiniStat
            icon="⏳"
            title="Pending"
            value={stats.pending}
          />

          <MiniStat
            icon="🎤"
            title="Interviews"
            value={stats.interviews}
          />

          <MiniStat
            icon="❌"
            title="Rejected"
            value={stats.rejected}
          />

        </div>


        {/* =========================
            ANALYTICS
        ========================= */}

        <div style={cardStyle}>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >

            <div>

              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "750",
                  margin: 0,
                }}
              >
                📊 Application Analytics
              </h2>

              <p
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                  marginTop: "5px",
                }}
              >
                Track the status of your applications.
              </p>

            </div>

          </div>


          <div
            style={{
              width: "100%",
              height: 320,
            }}
          >

            <ResponsiveContainer>

              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="status"
                  stroke="#64748b"
                />

                <YAxis
                  allowDecimals={false}
                  stroke="#64748b"
                />

                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #334155",
                    borderRadius: "10px",
                    color: "white",
                  }}
                />

                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[7, 7, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>


        {/* =========================
            QUICK ACTIONS
        ========================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "18px",
            marginTop: "25px",
          }}
        >

          <QuickAction
            icon="🔍"
            title="Explore Jobs"
            description="Find your next opportunity."
            button="Browse Jobs"
            onClick={() => navigate("/jobs")}
          />

          <QuickAction
            icon="🃏"
            title="Swipe Jobs"
            description="Discover jobs quickly with SwipeX."
            button="Start Swiping"
            onClick={() => navigate("/swipe")}
          />

          <QuickAction
            icon="📄"
            title="My Applications"
            description="Track your application progress."
            button="View Applications"
            onClick={() => navigate("/applications")}
          />

        </div>


        {/* =========================
            AI RECOMMENDATIONS
        ========================= */}

        <div
          style={{
            ...cardStyle,
            marginTop: "25px",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
            }}
          >

            <div>

              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "750",
                  margin: 0,
                }}
              >
                🤖 AI Job Recommendations
              </h2>

              <p
                style={{
                  color: "#64748b",
                  marginTop: "6px",
                }}
              >
                Opportunities selected based on your profile.
              </p>

            </div>


            <button
              onClick={() =>
                setShowRecommendations(
                  !showRecommendations
                )
              }
              style={{
                background:
                  "linear-gradient(90deg, #2563eb, #7c3aed)",
                color: "white",
                border: "none",
                padding: "10px 17px",
                borderRadius: "9px",
                cursor: "pointer",
                fontWeight: "600",
                whiteSpace: "nowrap",
              }}
            >
              {showRecommendations
                ? "Hide"
                : "Show Recommendations"}
            </button>

          </div>


          {showRecommendations && (

            <div style={{ marginTop: "22px" }}>

              {recommendedJobs.length === 0 ? (

                <div
                  style={{
                    textAlign: "center",
                    padding: "35px",
                    background: "#0f172a",
                    borderRadius: "12px",
                  }}
                >

                  <div style={{ fontSize: "40px" }}>
                    🔍
                  </div>

                  <p
                    style={{
                      color: "#94a3b8",
                      marginTop: "10px",
                    }}
                  >
                    No recommendations available yet.
                  </p>

                </div>

              ) : (

                recommendedJobs.map((job) => (

                  <div
                    key={job.id}
                    style={{
                      background:
                        "linear-gradient(145deg, #111827, #0f172a)",
                      border:
                        "1px solid #1e293b",
                      borderRadius: "14px",
                      padding: "20px",
                      marginBottom: "12px",
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: "15px",
                      }}
                    >

                      <div>

                        <h3
                          style={{
                            fontSize: "18px",
                            fontWeight: "700",
                            margin: 0,
                          }}
                        >
                          {job.title}
                        </h3>

                        <p
                          style={{
                            color: "#60a5fa",
                            marginTop: "6px",
                          }}
                        >
                          🏢 {job.company_name}
                        </p>

                      </div>

                      <span
                        style={{
                          background: "#172554",
                          color: "#93c5fd",
                          padding: "5px 10px",
                          borderRadius: "15px",
                          height: "fit-content",
                          fontSize: "12px",
                        }}
                      >
                        Recommended
                      </span>

                    </div>


                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "12px",
                        flexWrap: "wrap",
                      }}
                    >

                      <span style={badgeStyle}>
                        📍 {job.location}
                      </span>

                      {job.job_type && (
                        <span style={badgeStyle}>
                          💼 {job.job_type}
                        </span>
                      )}

                    </div>


                    <p
                      style={{
                        color: "#94a3b8",
                        lineHeight: "1.6",
                        marginTop: "12px",
                      }}
                    >
                      {job.description}
                    </p>

                  </div>

                ))

              )}

            </div>

          )}

        </div>


        {/* =========================
            RECENT ACTIVITY
        ========================= */}

        <div
          style={{
            ...cardStyle,
            marginTop: "25px",
          }}
        >

          <h2
            style={{
              fontSize: "22px",
              fontWeight: "750",
              marginBottom: "18px",
            }}
          >
            🕒 Recent Activity
          </h2>


          <Activity
            icon="🚀"
            title="Welcome to SwipeX"
            text="Start exploring jobs matched to your skills."
          />

          <Activity
            icon="🤖"
            title="AI Matching"
            text="Your profile can be used to generate personalized recommendations."
          />

          <Activity
            icon="📊"
            title="Application Analytics"
            text="Track your applications and recruitment progress above."
          />

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   COMPONENTS
===================================================== */

function StatCard({
  icon,
  title,
  value,
  subtitle,
  color,
}) {
  return (
    <div
      style={{
        background:
          "linear-gradient(145deg, #111827, #0f172a)",
        border: "1px solid #1e293b",
        borderRadius: "16px",
        padding: "22px",
        boxShadow:
          "0 10px 25px rgba(0,0,0,0.2)",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >

        <div
          style={{
            width: "45px",
            height: "45px",
            borderRadius: "12px",
            background: `${color}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "21px",
          }}
        >
          {icon}
        </div>

        <span
          style={{
            color,
            fontSize: "32px",
            fontWeight: "800",
          }}
        >
          {value}
        </span>

      </div>

      <h3
        style={{
          marginTop: "16px",
          fontSize: "16px",
          fontWeight: "700",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: "#64748b",
          fontSize: "13px",
          marginTop: "4px",
        }}
      >
        {subtitle}
      </p>

    </div>
  );
}


function MiniStat({
  icon,
  title,
  value,
}) {
  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1e293b",
        borderRadius: "13px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}
    >

      <span style={{ fontSize: "22px" }}>
        {icon}
      </span>

      <div>

        <p
          style={{
            color: "#64748b",
            fontSize: "12px",
          }}
        >
          {title}
        </p>

        <p
          style={{
            fontSize: "22px",
            fontWeight: "750",
          }}
        >
          {value}
        </p>

      </div>

    </div>
  );
}


function QuickAction({
  icon,
  title,
  description,
  button,
  onClick,
}) {
  return (
    <div
      style={{
        background:
          "linear-gradient(145deg, #111827, #0f172a)",
        border: "1px solid #1e293b",
        borderRadius: "15px",
        padding: "22px",
      }}
    >

      <div style={{ fontSize: "30px" }}>
        {icon}
      </div>

      <h3
        style={{
          fontSize: "18px",
          fontWeight: "700",
          marginTop: "10px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: "#64748b",
          fontSize: "14px",
          marginTop: "5px",
          marginBottom: "15px",
        }}
      >
        {description}
      </p>

      <button
        onClick={onClick}
        style={{
          background: "#1e293b",
          border: "1px solid #334155",
          color: "#93c5fd",
          padding: "9px 14px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        {button} →
      </button>

    </div>
  );
}


function Activity({
  icon,
  title,
  text,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "15px",
        padding: "15px 0",
        borderBottom: "1px solid #1e293b",
      }}
    >

      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: "#1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>

        <h4
          style={{
            fontWeight: "700",
          }}
        >
          {title}
        </h4>

        <p
          style={{
            color: "#64748b",
            fontSize: "14px",
            marginTop: "3px",
          }}
        >
          {text}
        </p>

      </div>

    </div>
  );
}


/* =====================================================
   STYLES
===================================================== */

const cardStyle = {
  background:
    "linear-gradient(145deg, #111827, #0f172a)",
  border: "1px solid #1e293b",
  borderRadius: "16px",
  padding: "24px",
  boxShadow:
    "0 10px 25px rgba(0,0,0,0.2)",
};

const badgeStyle = {
  background: "#1e293b",
  color: "#cbd5e1",
  padding: "6px 10px",
  borderRadius: "7px",
  fontSize: "12px",
};