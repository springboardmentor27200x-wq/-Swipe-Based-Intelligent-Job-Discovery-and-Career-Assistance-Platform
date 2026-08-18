import { useEffect, useState } from "react";
import axios from "../api";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [atsResult, setAtsResult] = useState(null);

  const [experienceFilter, setExperienceFilter] = useState("");
  const [salaryFilter, setSalaryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [savingJob, setSavingJob] = useState(null);
  const [appliedJob, setAppliedJob] = useState(null);

  useEffect(() => {
    axios
      .get("jobs/")
      .then((res) => setJobs(res.data))
      .catch((err) => console.log(err));
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchSearch =
      job.title?.toLowerCase().includes(search.toLowerCase());

    const matchExperience =
      !experienceFilter || job.experience === experienceFilter;

    const matchLocation =
      !locationFilter ||
      job.location
        ?.toLowerCase()
        .includes(locationFilter.toLowerCase());

    const matchType =
      !typeFilter || job.job_type === typeFilter;

    const salary = Number(job.salary);

    const matchSalary =
      !salaryFilter ||
      (salaryFilter === "below5" && salary < 500000) ||
      (salaryFilter === "5to10" &&
        salary >= 500000 &&
        salary <= 1000000) ||
      (salaryFilter === "above10" && salary > 1000000);

    return (
      matchSearch &&
      matchExperience &&
      matchLocation &&
      matchType &&
      matchSalary
    );
  });

  const handleSave = async (jobId) => {
    try {
      setSavingJob(jobId);

      await axios.post(
        "saved-jobs/",
        {
          job: jobId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        }
      );

      alert("❤️ Job Saved Successfully");

    } catch (err) {
      console.log(err.response);
      console.log(err.response?.data);

      alert("Already Saved or Error");

    } finally {
      setSavingJob(null);
    }
  };

  const handleApply = async (jobId) => {
    try {
      setAppliedJob(jobId);

      await axios.post(
        "apply/",
        {
          job_id: jobId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        }
      );

      const ats = await axios.get(
        `ats-score/${jobId}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        }
      );

      console.log("ATS RESPONSE:", ats.data);

      setAtsResult(ats.data);

      alert("✅ Job Applied Successfully");

    } catch (err) {
      console.log(err);
      console.log(err.response?.data);

      alert("Application Failed");

    } finally {
      setAppliedJob(null);
    }
  };

  const getCompetitionColor = (competition) => {
    if (competition === "Low") return "#22c55e";
    if (competition === "Medium") return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #080b14 0%, #101827 50%, #0b1120 100%)",
        color: "#f8fafc",
        padding: "40px",
      }}
    >

      {/* HEADER */}

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >

        <div style={{ marginBottom: "35px" }}>

          <p
            style={{
              color: "#60a5fa",
              fontSize: "14px",
              fontWeight: "600",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            SwipeX AI
          </p>

          <h1
            style={{
              fontSize: "38px",
              fontWeight: "800",
              margin: 0,
            }}
          >
            Discover Your Next Opportunity 🚀
          </h1>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "16px",
              marginTop: "10px",
            }}
          >
            Find jobs that match your skills, experience and career goals.
          </p>

        </div>


        {/* SEARCH */}

        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "30px",
            backdropFilter: "blur(10px)",
          }}
        >

          <div
            style={{
              position: "relative",
              marginBottom: "18px",
            }}
          >

            <span
              style={{
                position: "absolute",
                left: "16px",
                top: "13px",
                fontSize: "18px",
              }}
            >
              🔍
            </span>

            <input
              type="text"
              placeholder="Search jobs by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 18px 13px 45px",
                borderRadius: "10px",
                border: "1px solid #334155",
                background: "#111827",
                color: "white",
                outline: "none",
                fontSize: "15px",
              }}
            />

          </div>


          {/* FILTERS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "12px",
            }}
          >

            <select
              value={experienceFilter}
              onChange={(e) =>
                setExperienceFilter(e.target.value)
              }
              style={filterStyle}
            >
              <option value="">All Experience</option>
              <option value="Fresher">Fresher</option>
              <option value="1-2 Years">1-2 Years</option>
              <option value="3+ Years">3+ Years</option>
            </select>


            <select
              value={salaryFilter}
              onChange={(e) =>
                setSalaryFilter(e.target.value)
              }
              style={filterStyle}
            >
              <option value="">All Salaries</option>
              <option value="below5">Below ₹5 LPA</option>
              <option value="5to10">₹5–10 LPA</option>
              <option value="above10">Above ₹10 LPA</option>
            </select>


            <input
              type="text"
              placeholder="📍 Location"
              value={locationFilter}
              onChange={(e) =>
                setLocationFilter(e.target.value)
              }
              style={filterStyle}
            />


            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
              style={filterStyle}
            >
              <option value="">All Job Types</option>
              <option value="AI">AI</option>
              <option value="ML">ML</option>
              <option value="IT">IT</option>
              <option value="Internship">Internship</option>
            </select>

          </div>

        </div>


        {/* RESULT COUNT */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
          }}
        >

          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
            }}
          >
            Available Jobs
          </h2>

          <span
            style={{
              background: "#1e293b",
              padding: "7px 14px",
              borderRadius: "20px",
              color: "#93c5fd",
              fontSize: "14px",
            }}
          >
            {filteredJobs.length} opportunities
          </span>

        </div>


        {/* JOBS */}

        {filteredJobs.length === 0 ? (

          <div
            style={{
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: "16px",
              padding: "50px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "45px" }}>
              🔍
            </div>

            <h2 style={{ marginTop: "15px" }}>
              No jobs found
            </h2>

            <p style={{ color: "#94a3b8" }}>
              Try changing your search or filters.
            </p>

          </div>

        ) : (

          filteredJobs.map((job) => (

            <div
              key={job.id}
              style={{
                background:
                  "linear-gradient(145deg, #111827, #0f172a)",
                border: "1px solid #1e293b",
                borderRadius: "18px",
                padding: "25px",
                marginBottom: "18px",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.25)",
                transition: "0.2s",
              }}
            >

              {/* JOB HEADER */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "20px",
                  alignItems: "flex-start",
                }}
              >

                <div>

                  <h2
                    style={{
                      fontSize: "24px",
                      fontWeight: "750",
                      margin: 0,
                    }}
                  >
                    {job.title}
                  </h2>

                  <p
                    style={{
                      color: "#60a5fa",
                      fontWeight: "600",
                      marginTop: "7px",
                    }}
                  >
                    🏢 {job.company_name}
                  </p>

                </div>

                <span
                  style={{
                    background: "#172554",
                    color: "#93c5fd",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {job.job_type}
                </span>

              </div>


              {/* JOB DETAILS */}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginTop: "18px",
                }}
              >

                <span style={badgeStyle}>
                  📍 {job.location}
                </span>

                <span style={badgeStyle}>
                  💰 ₹{job.salary}
                </span>

                <span style={badgeStyle}>
                  🎓 {job.experience || "Not specified"}
                </span>

              </div>


              {/* COMPETITION */}

              <div
                style={{
                  display: "flex",
                  gap: "25px",
                  marginTop: "18px",
                  paddingTop: "15px",
                  borderTop: "1px solid #1e293b",
                }}
              >

                <span style={{ color: "#94a3b8" }}>
                  👥 {job.applicant_count || 0} Applicants
                </span>

                <span
                  style={{
                    color: getCompetitionColor(
                      job.competition
                    ),
                    fontWeight: "700",
                  }}
                >
                  🔥 {job.competition || "Low"} Competition
                </span>

              </div>


              {/* DESCRIPTION */}

              <p
                style={{
                  color: "#cbd5e1",
                  lineHeight: "1.7",
                  marginTop: "18px",
                }}
              >
                {job.description}
              </p>


              {/* BUTTONS */}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "22px",
                }}
              >

                <button
                  onClick={() => handleSave(job.id)}
                  disabled={savingJob === job.id}
                  style={{
                    ...buttonStyle,
                    background:
                      savingJob === job.id
                        ? "#334155"
                        : "#2563eb",
                  }}
                >
                  {savingJob === job.id
                    ? "Saving..."
                    : "❤️ Save Job"}
                </button>


                <button
                  onClick={() => handleApply(job.id)}
                  disabled={appliedJob === job.id}
                  style={{
                    ...buttonStyle,
                    background:
                      appliedJob === job.id
                        ? "#334155"
                        : "#16a34a",
                  }}
                >
                  {appliedJob === job.id
                    ? "Applying..."
                    : "📄 Apply Job"}
                </button>

              </div>


              {/* ATS RESULT */}

              {atsResult && (
                <div
                  style={{
                    marginTop: "22px",
                    background:
                      "linear-gradient(135deg, #111827, #172033)",
                    border:
                      "1px solid #2563eb",
                    borderRadius: "14px",
                    padding: "20px",
                  }}
                >

                  <h3
                    style={{
                      fontSize: "22px",
                      fontWeight: "800",
                      color: "#60a5fa",
                    }}
                  >
                    🤖 AI Resume Analysis
                  </h3>


                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: "800",
                      marginTop: "12px",
                      color:
                        atsResult.ats_score >= 70
                          ? "#22c55e"
                          : atsResult.ats_score >= 40
                          ? "#f59e0b"
                          : "#ef4444",
                    }}
                  >
                    {atsResult.ats_score}%
                  </div>

                  <p
                    style={{
                      color: "#94a3b8",
                      marginBottom: "15px",
                    }}
                  >
                    ATS Compatibility Score
                  </p>


                  <p
                    style={{
                      color: "#22c55e",
                      fontWeight: "700",
                    }}
                  >
                    ✓ Matched Skills
                  </p>

                  <p
                    style={{
                      color: "#cbd5e1",
                      marginTop: "5px",
                    }}
                  >
                    {atsResult.matched_skills?.join(", ") ||
                      "No matched skills"}
                  </p>


                  <p
                    style={{
                      color: "#ef4444",
                      fontWeight: "700",
                      marginTop: "15px",
                    }}
                  >
                    ✕ Missing Skills
                  </p>

                  <p
                    style={{
                      color: "#cbd5e1",
                      marginTop: "5px",
                    }}
                  >
                    {atsResult.missing_skills?.join(", ") ||
                      "No missing skills"}
                  </p>


                  <p
                    style={{
                      color: "#f8fafc",
                      fontWeight: "700",
                      marginTop: "15px",
                    }}
                  >
                    💡 AI Suggestions
                  </p>

                  <ul
                    style={{
                      marginTop: "8px",
                      paddingLeft: "20px",
                      color: "#cbd5e1",
                    }}
                  >
                    {atsResult.suggestions?.map(
                      (suggestion, index) => (
                        <li key={index}>
                          {suggestion}
                        </li>
                      )
                    )}
                  </ul>

                </div>
              )}

            </div>

          ))

        )}

      </div>

    </div>
  );
}


/* =========================
   STYLES
========================= */

const filterStyle = {
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #334155",
  background: "#111827",
  color: "#e2e8f0",
  outline: "none",
  fontSize: "14px",
};

const badgeStyle = {
  background: "#1e293b",
  color: "#cbd5e1",
  padding: "7px 12px",
  borderRadius: "8px",
  fontSize: "13px",
};

const buttonStyle = {
  color: "white",
  padding: "11px 20px",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
};

export default Jobs;