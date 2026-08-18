import { useEffect, useState } from "react";
import axios from "../api";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";

function MyJobs() {

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const token = localStorage.getItem("access");


  useEffect(() => {
    fetchMyJobs();
  }, []);


  const fetchMyJobs = async () => {

    try {

      const res = await axios.get("jobs/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setJobs(res.data);

    } catch (err) {

      console.log(
        "MY JOBS ERROR:",
        err.response?.data || err
      );

    } finally {

      setLoading(false);

    }
  };


  const handleDelete = async (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this job?"
    );

    if (!confirmDelete) return;

    try {

      await axios.delete(`jobs/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("✅ Job deleted successfully");

      setJobs(
        jobs.filter((job) => job.id !== id)
      );

    } catch (err) {

      console.log(
        "DELETE ERROR:",
        err.response?.data || err
      );

      alert("Unable to delete job.");

    }
  };


  return (

    <div className="flex">

      <Sidebar />

      <div className="ml-64 flex-1 min-h-screen bg-gray-100 p-10">

        <div className="max-w-6xl mx-auto">

          <h1 className="text-4xl font-bold text-slate-900">
            My Jobs 📋
          </h1>

          <p className="text-gray-500 mt-2 mb-8">
            Manage the jobs posted by you.
          </p>


          {loading ? (

            <div className="bg-white rounded-xl p-10 text-center">
              <p className="text-gray-500">
                Loading jobs...
              </p>
            </div>

          ) : jobs.length === 0 ? (

            <div className="bg-white rounded-2xl shadow p-12 text-center">

              <div className="text-5xl mb-4">
                📋
              </div>

              <h2 className="text-2xl font-bold">
                No Jobs Posted Yet
              </h2>

              <p className="text-gray-500 mt-2">
                Start by posting your first job opportunity.
              </p>

              <button
                onClick={() => navigate("/post-job")}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                ➕ Post Your First Job
              </button>

            </div>

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {jobs.map((job) => (

                <div
                  key={job.id}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >

                  <div className="flex justify-between items-start">

                    <div>

                      <h2 className="text-2xl font-bold text-slate-900">
                        {job.title}
                      </h2>

                      <p className="text-gray-500 mt-1">
                        🏢 {job.company_name || "Your Company"}
                      </p>

                    </div>

                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                      Active
                    </span>

                  </div>


                  <div className="grid grid-cols-2 gap-3 mt-5">

                    <div className="bg-gray-50 p-3 rounded-lg">
                      📍 {job.location}
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      💼 {job.job_type}
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      💰 ₹{job.salary}
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      👤 {job.experience}
                    </div>

                  </div>


                  <p className="text-gray-600 mt-5 line-clamp-3">
                    {job.description}
                  </p>


                  <div className="flex gap-3 mt-6">

                    <button
                      onClick={() =>
                        navigate(`/edit-job/${job.id}`)
                      }
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
                    >
                      ✏️ Edit
                    </button>


                    <button
                      onClick={() =>
                        handleDelete(job.id)
                      }
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold"
                    >
                      🗑️ Delete
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>

  );
}

export default MyJobs;