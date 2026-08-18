import { useEffect, useState } from "react";
import axios from "../api";
import Sidebar from "../components/Sidebar";
import { useNavigate, useParams } from "react-router-dom";

function EditJob() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState({
    title: "",
    description: "",
    location: "",
    salary: "",
    job_type: "",
    experience: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("access");


  useEffect(() => {
    fetchJob();
  }, []);


  const fetchJob = async () => {

    try {

      const res = await axios.get(
        `jobs/${id}/`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setJob({
        title: res.data.title || "",
        description: res.data.description || "",
        location: res.data.location || "",
        salary: res.data.salary || "",
        job_type: res.data.job_type || "",
        experience: res.data.experience || "",
      });

    } catch (err) {

      console.log(
        "EDIT JOB ERROR:",
        err.response?.data || err
      );

      alert("Unable to load job.");

      navigate("/my-jobs");

    } finally {

      setLoading(false);

    }
  };


  const handleChange = (e) => {

    setJob({
      ...job,
      [e.target.name]: e.target.value,
    });

  };


  const handleSubmit = async (e) => {

    e.preventDefault();

    setSaving(true);

    try {

      await axios.patch(
        `jobs/${id}/`,
        job,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      alert("✅ Job updated successfully!");

      navigate("/my-jobs");

    } catch (err) {

      console.log(
        "UPDATE JOB ERROR:",
        err.response?.data || err
      );

      alert(
        "Unable to update job. Check the details."
      );

    } finally {

      setSaving(false);

    }
  };


  if (loading) {

    return (
      <div className="p-10">
        Loading job...
      </div>
    );

  }


  return (

    <div className="flex">

      <Sidebar />

      <div className="ml-64 flex-1 min-h-screen bg-gray-100 p-10">

        <div className="max-w-3xl mx-auto">

          <div className="mb-8">

            <h1 className="text-4xl font-bold text-slate-900">
              Edit Job ✏️
            </h1>

            <p className="text-gray-500 mt-2">
              Update your job posting details.
            </p>

          </div>


          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-lg p-8"
          >

            {/* JOB TITLE */}

            <label className="block font-semibold mb-2">
              Job Title
            </label>

            <input
              name="title"
              value={job.title}
              onChange={handleChange}
              placeholder="e.g. AI Engineer"
              className="w-full border rounded-lg p-3 mb-5"
              required
            />


            {/* LOCATION */}

            <label className="block font-semibold mb-2">
              Location
            </label>

            <input
              name="location"
              value={job.location}
              onChange={handleChange}
              placeholder="e.g. Indore"
              className="w-full border rounded-lg p-3 mb-5"
              required
            />


            {/* SALARY */}

            <label className="block font-semibold mb-2">
              Salary
            </label>

            <input
              type="number"
              name="salary"
              value={job.salary}
              onChange={handleChange}
              placeholder="e.g. 800000"
              className="w-full border rounded-lg p-3 mb-5"
              required
            />


            {/* JOB TYPE */}

            <label className="block font-semibold mb-2">
              Job Type
            </label>

            <select
              name="job_type"
              value={job.job_type}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 mb-5"
              required
            >

              <option value="">
                Select Job Type
              </option>

              <option value="Full Time">
                Full Time
              </option>

              <option value="Part Time">
                Part Time
              </option>

              <option value="Internship">
                Internship
              </option>

              <option value="Contract">
                Contract
              </option>

            </select>


            {/* EXPERIENCE */}

            <label className="block font-semibold mb-2">
              Experience
            </label>

            <select
              name="experience"
              value={job.experience}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 mb-5"
              required
            >

              <option value="">
                Select Experience
              </option>

              <option value="Fresher">
                Fresher
              </option>

              <option value="1-2 Years">
                1-2 Years
              </option>

              <option value="3+ Years">
                3+ Years
              </option>

            </select>


            {/* DESCRIPTION */}

            <label className="block font-semibold mb-2">
              Job Description
            </label>

            <textarea
              name="description"
              value={job.description}
              onChange={handleChange}
              rows="7"
              placeholder="Describe the job responsibilities and required skills..."
              className="w-full border rounded-lg p-3 mb-6"
              required
            />


            {/* BUTTONS */}

            <div className="flex gap-4">

              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold"
              >
                {saving
                  ? "Saving..."
                  : "💾 Save Changes"}
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate("/my-jobs")
                }
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold"
              >
                Cancel
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}

export default EditJob;