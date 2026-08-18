import { useEffect, useState } from "react";
import axios from "../api";
import Sidebar from "../components/Sidebar";

function SwipeJobs() {
  const [jobs, setJobs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios
      .get("jobs/")
      .then((res) => setJobs(res.data))
      .catch((err) => console.log(err));
  }, []);

  const currentJob = jobs[currentIndex];

  const handleSave = async () => {
    if (!currentJob || saving) return;

    try {
      setSaving(true);

      await axios.post(
        "saved-jobs/",
        {
          job: currentJob.id,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        }
      );

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
        setSaving(false);
        setCurrentIndex((prev) => prev + 1);
      }, 900);

    } catch (err) {
      console.log(
        "SAVE JOB ERROR:",
        err.response?.data || err
      );

      alert(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Unable to save job"
      );

      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (saving) return;

    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #080b14 0%, #101827 50%, #0b1120 100%)",
        color: "#f8fafc",
      }}
    >

      <Sidebar />

      {/* MAIN AREA */}

      <div
        style={{
          marginLeft: "256px",
          minHeight: "100vh",
          padding: "35px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >

        {/* HEADER */}

        <div
          style={{
            width: "100%",
            maxWidth: "650px",
            marginBottom: "25px",
          }}
        >

          <p
            style={{
              color: "#60a5fa",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            SwipeX AI
          </p>

          <h1
            style={{
              fontSize: "32px",
              fontWeight: "800",
              marginTop: "5px",
            }}
          >
            Discover Your Next Job 💼
          </h1>

          <p
            style={{
              color: "#94a3b8",
              marginTop: "6px",
            }}
          >
            Swipe through opportunities and save the ones you like.
          </p>

        </div>


        {/* PROGRESS */}

        {currentJob && (
          <div
            style={{
              width: "100%",
              maxWidth: "650px",
              marginBottom: "15px",
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#64748b",
                fontSize: "12px",
                marginBottom: "7px",
              }}
            >
              <span>
                Opportunity {currentIndex + 1}
              </span>

              <span>
                {jobs.length} jobs
              </span>
            </div>

            <div
              style={{
                width: "100%",
                height: "5px",
                background: "#1e293b",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >

              <div
                style={{
                  width: `${Math.min(
                    ((currentIndex + 1) / jobs.length) * 100,
                    100
                  )}%`,
                  height: "100%",
                  background:
                    "linear-gradient(90deg, #2563eb, #7c3aed)",
                  borderRadius: "10px",
                }}
              />

            </div>

          </div>
        )}


        {/* NO JOBS */}

        {!currentJob ? (

          <div
            style={{
              width: "100%",
              maxWidth: "650px",
              background:
                "linear-gradient(145deg, #111827, #0f172a)",
              border: "1px solid #1e293b",
              borderRadius: "22px",
              padding: "55px 30px",
              textAlign: "center",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >

            <div
              style={{
                fontSize: "60px",
                marginBottom: "15px",
              }}
            >
              🎉
            </div>

            <h1
              style={{
                fontSize: "28px",
                fontWeight: "800",
              }}
            >
              No More Jobs
            </h1>

            <p
              style={{
                color: "#64748b",
                marginTop: "8px",
              }}
            >
              You've reached the end of the current job list.
            </p>

          </div>

        ) : (

          /* JOB CARD */

          <div
            style={{
              width: "100%",
              maxWidth: "650px",
              background:
                "linear-gradient(145deg, #111827, #0f172a)",
              border: "1px solid #1e293b",
              borderRadius: "24px",
              padding: "30px",
              boxSizing: "border-box",
              boxShadow:
                "0 25px 60px rgba(0,0,0,0.35)",
              position: "relative",
              overflow: "hidden",
            }}
          >

            {/* TOP GRADIENT */}

            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background:
                  "linear-gradient(90deg, #2563eb, #7c3aed)",
              }}
            />


            {/* COMPANY ICON */}

            <div
              style={{
                width: "65px",
                height: "65px",
                borderRadius: "16px",
                background:
                  "linear-gradient(135deg, #1d4ed8, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                marginBottom: "20px",
                boxShadow:
                  "0 10px 25px rgba(37,99,235,0.25)",
              }}
            >
              💼
            </div>


            {/* JOB TITLE */}

            <h1
              style={{
                fontSize: "30px",
                fontWeight: "800",
                lineHeight: "1.2",
              }}
            >
              {currentJob.title}
            </h1>


            {/* COMPANY */}

            {currentJob.company_name && (
              <p
                style={{
                  color: "#60a5fa",
                  fontWeight: "600",
                  marginTop: "8px",
                  fontSize: "16px",
                }}
              >
                🏢 {currentJob.company_name}
              </p>
            )}


            {/* JOB DETAILS */}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "20px",
              }}
            >

              <span style={badgeStyle}>
                📍 {currentJob.location}
              </span>

              <span style={badgeStyle}>
                💰 ₹{currentJob.salary}
              </span>

              <span style={badgeStyle}>
                💼 {currentJob.job_type}
              </span>

              {currentJob.experience && (
                <span style={badgeStyle}>
                  🎓 {currentJob.experience}
                </span>
              )}

            </div>


            {/* DIVIDER */}

            <div
              style={{
                height: "1px",
                background: "#1e293b",
                margin: "25px 0",
              }}
            />


            {/* DESCRIPTION */}

            <h3
              style={{
                fontSize: "16px",
                fontWeight: "700",
                marginBottom: "8px",
              }}
            >
              About the Role
            </h3>

            <p
              style={{
                color: "#94a3b8",
                lineHeight: "1.7",
                fontSize: "14px",
              }}
            >
              {currentJob.description}
            </p>


            {/* COMPETITION */}

            {currentJob.competition && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "13px 15px",
                  background: "#0b1220",
                  borderRadius: "10px",
                  border: "1px solid #1e293b",
                }}
              >

                <span
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                  }}
                >
                  🔥 Competition
                </span>

                <strong
                  style={{
                    marginLeft: "8px",
                    color:
                      currentJob.competition === "Low"
                        ? "#22c55e"
                        : currentJob.competition === "Medium"
                        ? "#f59e0b"
                        : "#ef4444",
                  }}
                >
                  {currentJob.competition}
                </strong>

              </div>
            )}


            {/* SUCCESS MESSAGE */}

            {saved && (
              <div
                style={{
                  marginTop: "22px",
                  padding: "14px",
                  borderRadius: "12px",
                  background:
                    "rgba(34,197,94,0.12)",
                  border:
                    "1px solid rgba(34,197,94,0.25)",
                  color: "#4ade80",
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                ❤️ Job Saved Successfully!
              </div>
            )}


            {/* ACTION BUTTONS */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                marginTop: "28px",
              }}
            >

              {/* SKIP */}

              <button
                onClick={handleSkip}
                disabled={saving}
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  border:
                    "1px solid rgba(239,68,68,0.3)",
                  background:
                    "rgba(239,68,68,0.08)",
                  color: "#f87171",
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                  fontSize: "15px",
                  fontWeight: "700",
                  opacity: saving ? 0.5 : 1,
                }}
              >
                👈 Skip
              </button>


              {/* SAVE */}

              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  border: "none",
                  background:
                    "linear-gradient(90deg, #2563eb, #7c3aed)",
                  color: "white",
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                  fontSize: "15px",
                  fontWeight: "700",
                  boxShadow:
                    "0 8px 20px rgba(37,99,235,0.25)",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? "⏳ Saving..."
                  : "❤️ Save Job"}
              </button>

            </div>


            {/* KEYBOARD HINT */}

            <p
              style={{
                textAlign: "center",
                color: "#475569",
                fontSize: "11px",
                marginTop: "18px",
              }}
            >
              Save jobs you're interested in and find them later
              in your Saved Jobs section.
            </p>

          </div>

        )}

      </div>

    </div>
  );
}


const badgeStyle = {
  background: "#1e293b",
  border: "1px solid #334155",
  color: "#cbd5e1",
  padding: "8px 11px",
  borderRadius: "9px",
  fontSize: "12px",
  fontWeight: "600",
};

export default SwipeJobs;