const API_URL = "https://swipex-backend-production.up.railway.app";


// =====================================
// PAGE LOAD
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    const registerForm =
        document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            registerUser
        );

    }


    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            loginUser
        );

    }

});


// =====================================
// REGISTER
// =====================================

async function registerUser(event) {

    event.preventDefault();


    const name =
        document.getElementById("name").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const role =
        document.getElementById("role").value;


    try {

        const response = await fetch(
            `${API_URL}/register`,
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    name: name,

                    email: email,

                    password: password,

                    role: role

                })

            }
        );


        const data =
            await response.json();


        console.log(
            "REGISTER RESPONSE:",
            data
        );


        if (!response.ok) {

            alert(
                data.detail ||
                data.message ||
                "Registration Failed"
            );

            return;

        }


        alert(
            "✅ Registration Successful!"
        );


        window.location.href =
            "/login";

    }


    catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );

        alert(
            "❌ Server Error"
        );

    }

}


// =====================================
// LOGIN
// =====================================

async function loginUser(event) {

    event.preventDefault();


    const email =
        document.getElementById("email")
            .value
            .trim();


    const password =
        document.getElementById("password")
            .value;


    try {

        const response = await fetch(
            `${API_URL}/login`,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    email: email,

                    password: password

                })

            }
        );


        const data =
            await response.json();


        console.log(
            "LOGIN RESPONSE:",
            data
        );


        // =================================
        // LOGIN FAILED
        // =================================

        if (!response.ok) {

            alert(
                data.detail ||
                data.message ||
                "Invalid Credentials"
            );

            return;

        }


        // =================================
        // SAVE TOKEN
        // =================================

        if (data.access_token) {

            localStorage.setItem(
                "token",
                data.access_token
            );

        }


        // =================================
        // GET ROLE
        // =================================

        let role =
            data.role;


        if (
            !role &&
            data.user &&
            data.user.role
        ) {

            role =
                data.user.role;

        }


        role =
    String(role || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");


        console.log(
            "FINAL ROLE:",
            role
        );


        // =================================
        // SAVE ROLE
        // =================================

        localStorage.setItem(
            "role",
            role
        );


        // =================================
        // SAVE USER
        // =================================

        if (data.user) {

            localStorage.setItem(
                "user",
                JSON.stringify(
                    data.user
                )
            );

        }


        // =================================
        // RECRUITER
        // =================================

        if (role === "recruiter") {

    alert("✅ Recruiter Login Successful!");

    window.location.replace("/recruiter");

    return;
}


if (role === "jobseeker") {

    alert("✅ Job Seeker Login Successful!");

    window.location.replace("/dashboard");

    return;
}

        // =================================
        // UNKNOWN ROLE
        // =================================

        alert(
            "⚠️ Login successful, but role was not recognized.\n\nRole: " +
            role
        );

    }


    catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        alert(
            "❌ Server Error. Make sure FastAPI is running."
        );

    }

}
