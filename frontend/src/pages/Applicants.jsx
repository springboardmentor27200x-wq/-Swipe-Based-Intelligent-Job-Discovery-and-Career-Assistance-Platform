import { useEffect, useState } from "react";
import axios from "../api";
import Sidebar from "../components/Sidebar";

function Applicants() {

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access");


  useEffect(() => {
    fetchApplicants();
  }, []);


  const fetchApplicants = async () => {

    try {

      const res = await axios.get("applications/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setApplications(res.data);

    } catch (err) {

      console.log(
        "APPLICANTS ERROR:",
        err.response?.data || err
      );

    } finally {

      setLoading(false);

    }

  };


  const updateStatus = async (id, status) => {

    try {

      await axios.patch(
        `applications/${id}/`,
        {
          status: status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(`✅ Application marked as ${status}`);

      fetchApplicants();

    } catch (err) {

      console.log(
        "STATUS UPDATE ERROR:",
        err.response?.data || err
      );

      alert("Unable to update application.");

    }

  };


  return (

    <div className="flex">

      <Sidebar />

      <div className="ml-64 flex-1 min-h-screen bg-gray-100 p-10">

        <div className="max-w-6xl mx-auto">

          <h1 className="text-4xl font-bold text-slate-900">
            Applicants 👥
          </h1>

          <p className="text-gray-500 mt-2 mb-8">
            Review candidates and manage your hiring workflow.
          </p>


          {loading ? (

            <div className="bg-white rounded-xl p-10 text-center">
              Loading applicants...
            </div>

          ) : applications.length === 0 ? (

            <div className="bg-white rounded-2xl shadow p-12 text-center">

              <div className="text-5xl mb-4">
                👥
              </div>

              <h2 className="text-2xl font-bold">
                No Applicants Yet
              </h2>

              <p className="text-gray-500 mt-2">
                Applications for your jobs will appear here.
              </p>

            </div>

          ) : (

            <div className="space-y-5">

              {applications.map((application) => (

                <div
                  key={application.id}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >

                  <div className="flex justify-between items-start">

                    <div>

                      <h2 className="text-2xl font-bold">
                        {application.applicant_name ||
                          application.applicant ||
                          "Candidate"}
                      </h2>

                      <p className="text-blue-600 font-semibold mt-1">
                        📋{" "}
                        {application.job_title ||
                          application.job ||
                          "Job Application"}
                      </p>

                    </div>


                    <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-semibold">
                      {application.status || "Pending"}
                    </span>

                  </div>


                  <div className="mt-5 text-gray-600">

                    <p>
                      📅 Applied:{" "}
                      {application.applied_at
                        ? new Date(
                            application.applied_at
                          ).toLocaleDateString()
                        : "Recently"}
                    </p>

                  </div>


                  <div className="flex flex-wrap gap-3 mt-6">

                    <button
                      onClick={() =>
                        updateStatus(
                          application.id,
                          "Shortlisted"
                        )
                      }
                      className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold"
                    >
                      ✅ Shortlist
                    </button>


                    <button
                      onClick={() =>
                        updateStatus(
                          application.id,
                          "Interview"
                        )
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold"
                    >
                      🎤 Interview
                    </button>


                    <button
                      onClick={() =>
                        updateStatus(
                          application.id,
                          "Rejected"
                        )
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold"
                    >
                      ❌ Reject
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

export default Applicants;