import { useEffect, useState } from "react";
import axios from "../api";
import Sidebar from "../components/Sidebar";


function Profile() {
  const [resume, setResume] = useState(null);
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    location: "",
    experience_level: "",
    bio: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("profile/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });

      setProfile(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSave = async () => {
  try {
    const formData = new FormData();

    formData.append("full_name", profile.full_name || "");
    formData.append("phone", profile.phone || "");
    formData.append("location", profile.location || "");
    formData.append("experience_level", profile.experience_level || "");
    formData.append("bio", profile.bio || "");

    if (resume) {
      formData.append("resume", resume);
    }

    await axios.patch("profile/", formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
    });

    alert("✅ Profile Saved Successfully");

  } catch (err) { 
  console.log(err); 
  console.log(err.response); 
  console.log(err.response?.data); 
  alert( 
    JSON.stringify(err.response?.data || err.message) 
  ); 
}
};
  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 flex-1 p-10 bg-gray-100 min-h-screen">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">

          <h1 className="text-3xl font-bold mb-6">
            👤 My Profile
          </h1>

          <div className="space-y-4">

            <input
              type="text"
              placeholder="Full Name"
              value={profile.full_name}
              onChange={(e) =>
                setProfile({...profile, full_name: e.target.value})
              }
              className="w-full border p-3 rounded-lg"
            />

            <input
              type="text"
              placeholder="Phone"
              value={profile.phone}
              onChange={(e) =>
                setProfile({...profile, phone: e.target.value})
              }
              className="w-full border p-3 rounded-lg"
            />

            <input
              type="text"
              placeholder="Location"
              value={profile.location}
              onChange={(e) =>
                setProfile({...profile, location: e.target.value})
              }
              className="w-full border p-3 rounded-lg"
            />

            <input
              type="text"
              placeholder="Experience Level"
              value={profile.experience_level}
              onChange={(e) =>
                setProfile({...profile, experience_level: e.target.value})
              }
              className="w-full border p-3 rounded-lg"
            />

            <textarea
              placeholder="Tell us about yourself..."
              value={profile.bio}
              onChange={(e) =>
                setProfile({...profile, bio: e.target.value})
              }
              className="w-full border p-3 rounded-lg h-32"
            />

            <input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => setResume(e.target.files[0])} 
                className="w-full border p-3 rounded-lg" 
            />

            {profile.resume && ( 
              <a 
                href={`http://127.0.0.1:8000${profile.resume}`} 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-600 underline block mt-2" 
             >  
                📄 View Uploaded Resume
             </a> 
        )}
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              💾 Save Profile
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

export default Profile;