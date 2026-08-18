import { useEffect, useState } from "react";
import axios from "../api";
import Sidebar from "../components/Sidebar";

function CompanyProfile() {

  const [company, setCompany] = useState({
    name: "",
    description: "",
    location: "",
    website: "",
    industry: "",
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("access");

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {

    try {

      const res = await axios.get(
        "company-profile/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCompany(res.data);

    } catch (err) {

      console.log(
        "COMPANY ERROR:",
        err.response?.data || err
      );

    } finally {

      setLoading(false);

    }
  };


  const handleChange = (e) => {

    setCompany({
      ...company,
      [e.target.name]: e.target.value,
    });

  };


  const saveCompany = async () => {

    try {

      await axios.put(
        "company-profile/",
        company,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        "✅ Company profile updated successfully!"
      );

    } catch (err) {

      console.log(
        "UPDATE COMPANY ERROR:",
        err.response?.data || err
      );

      setMessage(
        "❌ Unable to update company profile."
      );

    }
  };


  if (loading) {
    return (
      <div className="p-10">
        Loading...
      </div>
    );
  }


  return (

    <div className="flex">

      <Sidebar />

      <div className="ml-64 flex-1 min-h-screen bg-gray-100 p-10">

        <h1 className="text-4xl font-bold">
          Company Profile 🏢
        </h1>

        <p className="text-gray-500 mt-2 mb-8">
          Manage your company information.
        </p>


        <div className="bg-white rounded-2xl shadow p-8 max-w-3xl">

          <div className="grid grid-cols-2 gap-5">

            <input
              name="name"
              value={company.name}
              onChange={handleChange}
              placeholder="Company Name"
              className="border p-3 rounded-lg"
            />

            <input
              name="industry"
              value={company.industry}
              onChange={handleChange}
              placeholder="Industry"
              className="border p-3 rounded-lg"
            />

            <input
              name="location"
              value={company.location}
              onChange={handleChange}
              placeholder="Location"
              className="border p-3 rounded-lg"
            />

            <input
              name="website"
              value={company.website}
              onChange={handleChange}
              placeholder="Website"
              className="border p-3 rounded-lg"
            />

          </div>


          <textarea
            name="description"
            value={company.description}
            onChange={handleChange}
            placeholder="Company Description"
            rows="6"
            className="border p-3 rounded-lg w-full mt-5"
          />


          <button
            onClick={saveCompany}
            className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            💾 Save Company Profile
          </button>


          {message && (
            <p className="mt-4 font-semibold">
              {message}
            </p>
          )}

        </div>

      </div>

    </div>
  );
}

export default CompanyProfile;