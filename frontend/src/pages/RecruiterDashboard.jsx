import { useEffect, useState } from "react";
import axios from "../api";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function RecruiterDashboard() {

  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_jobs: 0,
    total_applicants: 0,
    pending: 0,
    shortlisted: 0,
    interviews: 0,
    rejected: 0,
  });

  const [applicants, setApplicants] = useState([]);
  const [trends, setTrends] = useState([]);

  const token = localStorage.getItem("access");

  useEffect(() => {
    fetchStats();
    fetchApplicants();
    fetchTrends();
  }, []);

  const fetchStats = async () => {

    try {

      const res = await axios.get(
        "recruiter-stats/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStats(res.data);

    } catch (err) {

      console.log(
        "RECRUITER STATS ERROR:",
        err.response?.data || err
      );

    }
  };


  const fetchApplicants = async () => {

    try {

      const res = await axios.get(
        "recruiter-applicants/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setApplicants(res.data);

    } catch (err) {

      console.log(
        "APPLICANTS ERROR:",
        err.response?.data || err
      );

    }
  };


  const fetchTrends = async () => {

    try {

      const res = await axios.get(
        "recruiter-trends/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTrends(res.data);

    } catch (err) {

      console.log(
        "TRENDS ERROR:",
        err.response?.data || err
      );

    }
  };


  const updateStatus = async (
    applicationId,
    newStatus
  ) => {

    try {

      await axios.patch(
        `update-application/${applicationId}/`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchApplicants();
      fetchStats();

    } catch (err) {

      console.log(
        "STATUS UPDATE ERROR:",
        err.response?.data || err
      );

      alert("Unable to update application status.");

    }
  };


  const handleLogout = () => {

    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");

    navigate("/");

  };


  return (

    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: "30px",
      }}
    >

      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >

        <div>

          <h1
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: "#0f172a",
            }}
          >
            Recruiter Dashboard 🏢
          </h1>

          <p style={{ color: "#64748b" }}>
            Manage jobs, applicants and your hiring workflow.
          </p>

        </div>


        <div>

          <button
            onClick={() => navigate("/post-job")}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "11px 18px",
              border: "none",
              borderRadius: "8px",
              marginRight: "10px",
              cursor: "pointer",
            }}
          >
            ➕ Post Job
          </button>

          <button
            onClick={handleLogout}
            style={{
              background: "#dc2626",
              color: "white",
              padding: "11px 18px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>

        </div>

      </div>


      {/* STATS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "30px",
        }}
      >

        <StatCard
          title="Jobs Posted"
          value={stats.total_jobs}
          icon="💼"
        />

        <StatCard
          title="Applicants"
          value={stats.total_applicants}
          icon="👥"
        />

        <StatCard
          title="Shortlisted"
          value={stats.shortlisted}
          icon="⭐"
        />

        <StatCard
          title="Interviews"
          value={stats.interviews}
          icon="🎯"
        />

      </div>


      {/* APPLICATION ANALYTICS */}

      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "15px",
          boxShadow:
            "0 4px 15px rgba(0,0,0,0.06)",
          marginBottom: "30px",
        }}
      >

        <h2
          style={{
            fontSize: "22px",
            fontWeight: "700",
            marginBottom: "20px",
          }}
        >
          📊 Application Trends
        </h2>

        <div
          style={{
            width: "100%",
            height: "320px",
          }}
        >

          <ResponsiveContainer>

            <BarChart data={trends}>

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="job" />

              <YAxis allowDecimals={false} />

              <Tooltip />

              <Bar
                dataKey="applications"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>


      {/* HIRING WORKFLOW */}

      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "15px",
          boxShadow:
            "0 4px 15px rgba(0,0,0,0.06)",
          marginBottom: "30px",
        }}
      >

        <h2
          style={{
            fontSize: "22px",
            fontWeight: "700",
            marginBottom: "20px",
          }}
        >
          🔄 Hiring Workflow
        </h2>

        <div
          style={{
            display: "flex",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >

          <Workflow
            title="Pending"
            value={stats.pending}
          />

          <Workflow
            title="Shortlisted"
            value={stats.shortlisted}
          />

          <Workflow
            title="Interview"
            value={stats.interviews}
          />

          <Workflow
            title="Rejected"
            value={stats.rejected}
          />

        </div>

      </div>


      {/* APPLICANTS */}

      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "15px",
          boxShadow:
            "0 4px 15px rgba(0,0,0,0.06)",
        }}
      >

        <h2
          style={{
            fontSize: "22px",
            fontWeight: "700",
            marginBottom: "20px",
          }}
        >
          👥 Recent Applicants
        </h2>


        {applicants.length === 0 ? (

          <p style={{ color: "#64748b" }}>
            No applicants yet.
          </p>

        ) : (

          <div
            style={{
              overflowX: "auto",
            }}
          >

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >

              <thead>

                <tr
                  style={{
                    background: "#f8fafc",
                  }}
                >

                  <th style={thStyle}>
                    Applicant
                  </th>

                  <th style={thStyle}>
                    Email
                  </th>

                  <th style={thStyle}>
                    Job
                  </th>

                  <th style={thStyle}>
                    Status
                  </th>

                  <th style={thStyle}>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {applicants.map((application) => (

                  <tr key={application.id}>

                    <td style={tdStyle}>
                      {application.applicant_name}
                    </td>

                    <td style={tdStyle}>
                      {application.email}
                    </td>

                    <td style={tdStyle}>
                      {application.job_title}
                    </td>

                    <td style={tdStyle}>

                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: "20px",
                          background:
                            application.status ===
                            "Shortlisted"
                              ? "#dcfce7"
                              : application.status ===
                                "Interview"
                              ? "#dbeafe"
                              : application.status ===
                                "Rejected"
                              ? "#fee2e2"
                              : "#fef3c7",
                          color:
                            application.status ===
                            "Rejected"
                              ? "#dc2626"
                              : "#334155",
                          fontWeight: "600",
                        }}
                      >
                        {application.status}
                      </span>

                    </td>

                    <td style={tdStyle}>

                      <select
                        value={application.status}
                        onChange={(e) =>
                          updateStatus(
                            application.id,
                            e.target.value
                          )
                        }
                        style={{
                          padding: "7px",
                          borderRadius: "7px",
                          border:
                            "1px solid #cbd5e1",
                        }}
                      >

                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Shortlisted">
                          Shortlisted
                        </option>

                        <option value="Interview">
                          Interview
                        </option>

                        <option value="Rejected">
                          Rejected
                        </option>

                      </select>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}


/* =========================
   COMPONENTS
========================= */

function StatCard({
  title,
  value,
  icon,
}) {

  return (

    <div
      style={{
        background: "white",
        padding: "22px",
        borderRadius: "15px",
        boxShadow:
          "0 4px 15px rgba(0,0,0,0.06)",
      }}
    >

      <div
        style={{
          fontSize: "28px",
        }}
      >
        {icon}
      </div>

      <h2
        style={{
          fontSize: "30px",
          fontWeight: "800",
          marginTop: "8px",
        }}
      >
        {value}
      </h2>

      <p style={{ color: "#64748b" }}>
        {title}
      </p>

    </div>
  );
}


function Workflow({
  title,
  value,
}) {

  return (

    <div
      style={{
        flex: 1,
        minWidth: "150px",
        padding: "20px",
        background: "#f8fafc",
        borderRadius: "12px",
        textAlign: "center",
      }}
    >

      <h3
        style={{
          fontSize: "25px",
          fontWeight: "800",
        }}
      >
        {value}
      </h3>

      <p style={{ color: "#64748b" }}>
        {title}
      </p>

    </div>
  );
}


const thStyle = {
  padding: "13px",
  textAlign: "left",
  borderBottom:
    "1px solid #e2e8f0",
  color: "#475569",
};


const tdStyle = {
  padding: "13px",
  borderBottom:
    "1px solid #f1f5f9",
};


export default RecruiterDashboard;