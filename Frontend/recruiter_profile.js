const API_URL =
    window.SWIPEX_API_URL;


// ==========================================
// LOAD PROFILE
// ==========================================

function loadProfile() {

    const username =
        localStorage.getItem("swipex_username") ||
        localStorage.getItem("username") ||
        "Recruiter";


    const email =
        localStorage.getItem("swipex_email") ||
        localStorage.getItem("email") ||
        "";


    const nameInput =
        document.getElementById("name");

    const emailInput =
        document.getElementById("email");

    const profileName =
        document.getElementById("profileName");


    if (nameInput) {

        nameInput.value = username;

    }


    if (emailInput) {

        emailInput.value = email;

    }


    if (profileName) {

        profileName.textContent =
            username;

    }


    // ======================================
    // LOAD OTHER PROFILE DETAILS
    // ======================================

    const phone =
        localStorage.getItem("swipex_phone");

    const company =
        localStorage.getItem("swipex_company");

    const designation =
        localStorage.getItem("swipex_designation");

    const location =
        localStorage.getItem("swipex_location");


    if (phone) {

        document.getElementById(
            "phone"
        ).value = phone;

    }


    if (company) {

        document.getElementById(
            "company"
        ).value = company;

        document.getElementById(
            "companyDisplay"
        ).textContent = company;

    }


    if (designation) {

        document.getElementById(
            "designation"
        ).value = designation;

    }


    if (location) {

        document.getElementById(
            "location"
        ).value = location;

    }

}


// ==========================================
// LOAD RECRUITER STATISTICS
// ==========================================

async function loadRecruiterStatistics() {

    try {

        const response =
            await fetch(
                `${API_URL}/jobs`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load jobs"
            );

        }


        const jobs =
            await response.json();


        // ======================================
        // JOBS POSTED
        // ======================================

        const jobsPosted =
            document.getElementById(
                "jobsPosted"
            );


        if (jobsPosted) {

            jobsPosted.textContent =
                jobs.length;

        }


        // ======================================
        // TOTAL APPLICATIONS
        // ======================================

        let totalApplications = 0;


        jobs.forEach(
            function (job) {

                totalApplications +=
                    Number(
                        job.applicant_count
                    ) || 0;

            }
        );


        const applications =
            document.getElementById(
                "applications"
            );


        if (applications) {

            applications.textContent =
                totalApplications;

        }

    }

    catch (error) {

        console.error(
            "Unable to load recruiter statistics:",
            error
        );


        // Keep values at zero if backend
        // cannot be reached

        const jobsPosted =
            document.getElementById(
                "jobsPosted"
            );


        const applications =
            document.getElementById(
                "applications"
            );


        if (jobsPosted) {

            jobsPosted.textContent =
                "0";

        }


        if (applications) {

            applications.textContent =
                "0";

        }

    }

}


// ==========================================
// SAVE PROFILE
// ==========================================

function saveProfile() {

    const name =
        document.getElementById(
            "name"
        ).value;


    const email =
        document.getElementById(
            "email"
        ).value;


    const phone =
        document.getElementById(
            "phone"
        ).value;


    const company =
        document.getElementById(
            "company"
        ).value;


    const designation =
        document.getElementById(
            "designation"
        ).value;


    const location =
        document.getElementById(
            "location"
        ).value;


    localStorage.setItem(
        "swipex_username",
        name
    );


    localStorage.setItem(
        "swipex_email",
        email
    );


    localStorage.setItem(
        "swipex_phone",
        phone
    );


    localStorage.setItem(
        "swipex_company",
        company
    );


    localStorage.setItem(
        "swipex_designation",
        designation
    );


    localStorage.setItem(
        "swipex_location",
        location
    );


    document.getElementById(
        "profileName"
    ).textContent =
        name;


    document.getElementById(
        "companyDisplay"
    ).textContent =
        company || "Not added";


    alert(
        "Profile updated successfully!"
    );

}


// ==========================================
// BACK TO RECRUITER DASHBOARD
// ==========================================

function backToRecruiterDashboard() {

    if (
        window.parent &&
        window.parent !== window
    ) {

        const frame =
            window.parent.document.getElementById(
                "contentFrame"
            );


        if (frame) {

            frame.src =
                "recruiter_home.html";

            return;

        }

    }


    window.location.href =
        "recruiter.html";

}


// ==========================================
// BACK TO DASHBOARD
// ==========================================

function goBack() {

    if (
        window.parent &&
        window.parent !== window &&
        typeof window.parent.loadPage ===
            "function"
    ) {

        window.parent.loadPage(
            "recruiter_home.html"
        );

        return;

    }


    window.location.href =
        "recruiter.html";

}


// ==========================================
// PROFILE PHOTO UPLOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const photoInput =
            document.getElementById(
                "profilePhoto"
            );


        const avatar =
            document.getElementById(
                "profileAvatar"
            );


        if (
            !photoInput ||
            !avatar
        ) {

            return;

        }


        // ==================================
        // LOAD SAVED PHOTO
        // ==================================

        const savedPhoto =
            localStorage.getItem(
                "swipex_profile_photo"
            );


        if (savedPhoto) {

            avatar.innerHTML =
                "";


            const img =
                document.createElement(
                    "img"
                );


            img.src =
                savedPhoto;


            img.alt =
                "Profile Photo";


            avatar.appendChild(
                img
            );

        }


        // ==================================
        // UPLOAD PHOTO
        // ==================================

        photoInput.addEventListener(
            "change",
            function () {

                const file =
                    this.files[0];


                if (!file) {

                    return;

                }


                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {

                    alert(
                        "Please select an image file."
                    );

                    return;

                }


                const reader =
                    new FileReader();


                reader.onload =
                    function (event) {

                        const imageData =
                            event.target.result;


                        avatar.innerHTML =
                            "";


                        const img =
                            document.createElement(
                                "img"
                            );


                        img.src =
                            imageData;


                        img.alt =
                            "Profile Photo";


                        avatar.appendChild(
                            img
                        );


                        localStorage.setItem(
                            "swipex_profile_photo",
                            imageData
                        );

                    };


                reader.onerror =
                    function () {

                        alert(
                            "Unable to read the image."
                        );

                    };


                reader.readAsDataURL(
                    file
                );

            }
        );

    }
);


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadProfile();

        loadRecruiterStatistics();

    }
);