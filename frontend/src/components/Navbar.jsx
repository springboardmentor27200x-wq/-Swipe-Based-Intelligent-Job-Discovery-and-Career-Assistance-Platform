import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <h2 className="logo">SwipeX</h2>

      <div className="nav-links">
        <Link to="/dashboard">Home</Link>
        <Link to="#">Companies</Link>
        <Link to="#">Jobs</Link>
        <Link to="#">Resume</Link>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;