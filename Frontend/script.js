const API_URL =
    window.SWIPEX_API_URL;

// ================================
// ROLE SELECTION
// ================================

function selectRole(button, role) {

    const buttons =
        document.querySelectorAll(".role-btn");

    buttons.forEach(function(btn) {

        btn.classList.remove("selected");

    });

    button.classList.add("selected");

    document.getElementById("role").value =
        role;

}


// ================================
// REGISTER
// ================================

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function(e) {

            e.preventDefault();


            const username =
                document.getElementById(
                    "username"
                ).value.trim();


            const email =
                document.getElementById(
                    "email"
                ).value.trim();


            const password =
                document.getElementById(
                    "password"
                ).value;


            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;


            const role =
                document.getElementById(
                    "role"
                ).value;


            // ============================
            // PASSWORD CHECK
            // ============================

            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "Passwords do not match!"
                );

                return;

            }


            // ============================
            // ROLE CHECK
            // ============================

            if (role === "") {

                alert(
                    "Please select Job Seeker or Recruiter."
                );

                return;

            }


            try {

                const response =
                    await fetch(
                        `${API_URL}/register`,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    username:
                                        username,

                                    email:
                                        email,

                                    password:
                                        password,

                                    role:
                                        role

                                })

                        }
                    );


                const data =
                    await response.json();


                // ============================
                // SUCCESS
                // ============================

                if (response.ok) {

                    // Save login information

                    localStorage.setItem(
                        "swipex_username",
                        data.username
                    );


                    localStorage.setItem(
                        "swipex_role",
                        data.role
                    );


                    localStorage.setItem(
                        "swipex_email",
                        email
                    );


                    // ========================
                    // ROLE-BASED REDIRECT
                    // ========================

                    if (
                        data.role
                            .toLowerCase()
                            .replace(/\s+/g, "")
                            === "recruiter"
                    ) {

                        window.location.href =
                            "recruiter.html";

                    }

                    else if (
                        data.role
                            .toLowerCase()
                            .replace(/\s+/g, "")
                            === "jobseeker"
                    ) {

                        window.location.href =
                            "jobseeker.html";

                    }

                    else {

                        alert(
                            "Unknown user role."
                        );

                    }

                }

                else {

                    alert(
                        data.detail ||
                        "Registration failed."
                    );

                }

            }

            catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                alert(
                    "Backend is not running!"
                );

            }

        }
    );

}


// ================================
// LOGIN
// ================================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(e) {

            e.preventDefault();


            const email =
                document.getElementById(
                    "loginEmail"
                ).value.trim();


            const password =
                document.getElementById(
                    "loginPassword"
                ).value;


            try {

                const response =
                    await fetch(
                        `${API_URL}/login`,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    email:
                                        email,

                                    password:
                                        password

                                })

                        }
                    );


                const data =
                    await response.json();


                // ============================
                // SUCCESS
                // ============================

                if (response.ok) {

                    localStorage.setItem(
                        "swipex_username",
                        data.username
                    );


                    localStorage.setItem(
                        "swipex_role",
                        data.role
                    );


                    localStorage.setItem(
                        "swipex_email",
                        email
                    );


                    // ========================
                    // ROLE-BASED REDIRECT
                    // ========================

                    if (
                        data.role
                            .toLowerCase()
                            .replace(/\s+/g, "")
                            === "jobseeker"
                    ) {

                        window.location.href =
                            "jobseeker.html";

                    }

                    else if (
                        data.role
                            .toLowerCase()
                            .replace(/\s+/g, "")
                            === "recruiter"
                    ) {

                        window.location.href =
                            "recruiter.html";

                    }

                    else {

                        alert(
                            "Unknown user role."
                        );

                    }

                }

                else {

                    alert(
                        data.detail ||
                        "Invalid Email or Password"
                    );

                }

            }

            catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                alert(
                    "Backend is not running"
                );

            }

        }
    );

}


// ================================
// LOGOUT
// ================================

function logout() {

    localStorage.clear();

    window.location.href =
        "login.html";

}