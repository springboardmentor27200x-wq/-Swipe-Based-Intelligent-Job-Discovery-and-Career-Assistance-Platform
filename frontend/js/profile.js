const API_URL = "https://swipex-backend-production.up.railway.app";
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/login";
}

fetch(`${API_URL}/api/profile`, {
    method: "GET",
    headers: {
        "Authorization": "Bearer " + token
    }
})
.then(async (res) => {

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.detail || "Failed to load profile");
    }

    return data;
})
.then(data => {

    console.log("PROFILE RESPONSE:", data);

    document.getElementById("userName").innerText =
    data.user?.name || "User";

document.getElementById("userEmail").innerText =
    data.user?.email || "Email not available";

})
.catch(error => {

    console.error("PROFILE ERROR:", error);

    document.getElementById("userName").innerText =
        "Unable to load profile";

    document.getElementById("userEmail").innerText =
        "Unable to load profile";
});


const logoutButton = document.getElementById("logout");

if (logoutButton) {

    logoutButton.onclick = () => {

        localStorage.clear();

        window.location.href = "/login";

    };

}

