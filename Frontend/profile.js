// ==========================================
// USERNAME
// ==========================================

function getUsername() {

    return (
        localStorage.getItem("swipex_username") ||
        localStorage.getItem("username") ||
        "Job Seeker"
    );

}


// ==========================================
// LOAD PROFILE
// ==========================================

function loadProfile() {

    const username = getUsername();

    let profile = {};


    try {

        profile =
            JSON.parse(
                localStorage.getItem("swipex_profile")
            ) || {};

    }

    catch (error) {

        console.error(
            "Profile data error:",
            error
        );

    }


    const savedEmail =
        localStorage.getItem("swipex_email") ||
        localStorage.getItem("email") ||
        "";


    document.getElementById("fullName").value =
        profile.fullName || username;


    document.getElementById("email").value =
        profile.email || savedEmail;


    document.getElementById("phone").value =
        profile.phone || "";


    document.getElementById("location").value =
        profile.location || "";


    document.getElementById("headline").value =
        profile.headline || "";


    document.getElementById("about").value =
        profile.about || "";


    document.getElementById("skills").value =
        profile.skills || "";


    document.getElementById("education").value =
        profile.education || "";


    document.getElementById("experience").value =
        profile.experience || "";


    updateHero(
        profile.fullName || username,
        profile.email || savedEmail
    );


    loadProfilePhoto();

    loadResumeInfo();

}


// ==========================================
// UPDATE HERO
// ==========================================

function updateHero(
    name,
    email
) {

    document.getElementById(
        "displayName"
    ).textContent =
        name || "Job Seeker";


    document.getElementById(
        "displayEmail"
    ).textContent =
        email || "Email not added";


    const avatar =
        document.getElementById(
            "profileAvatar"
        );


    const initials =
        getInitials(
            name || "Job Seeker"
        );


    /*
        Only show initials if
        there is no profile photo.
    */

    if (
        !localStorage.getItem(
            "swipex_profile_photo"
        )
    ) {

        avatar.textContent =
            initials;

        avatar.style.backgroundImage =
            "";

        avatar.classList.remove(
            "photo-avatar"
        );

    }

}


// ==========================================
// INITIALS
// ==========================================

function getInitials(name) {

    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


// ==========================================
// PROFILE PHOTO INPUT
// ==========================================

const photoInput =
    document.getElementById(
        "profilePhotoInput"
    );


if (photoInput) {

    photoInput.addEventListener(
        "change",
        function(event) {

            const file =
                event.target.files[0];


            if (!file) {

                return;

            }


            // Make sure it is an image

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


            // Limit image size

            if (
                file.size > 5 * 1024 * 1024
            ) {

                alert(
                    "Please select an image smaller than 5 MB."
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                function(e) {

                    const imageData =
                        e.target.result;


                    // Save photo

                    localStorage.setItem(
                        "swipex_profile_photo",
                        imageData
                    );


                    // Display photo

                    displayProfilePhoto(
                        imageData
                    );

                };


            reader.readAsDataURL(file);

        }
    );

}


// ==========================================
// DISPLAY PROFILE PHOTO
// ==========================================

function displayProfilePhoto(
    imageData
) {

    const avatar =
        document.getElementById(
            "profileAvatar"
        );


    if (!avatar) {

        return;

    }


    avatar.textContent = "";


    avatar.style.backgroundImage =
        `url("${imageData}")`;


    avatar.classList.add(
        "photo-avatar"
    );


    const removeButton =
        document.getElementById(
            "removePhotoButton"
        );


    if (removeButton) {

        removeButton.style.display =
            "block";

    }

}


// ==========================================
// LOAD SAVED PHOTO
// ==========================================

function loadProfilePhoto() {

    const imageData =
        localStorage.getItem(
            "swipex_profile_photo"
        );


    if (imageData) {

        displayProfilePhoto(
            imageData
        );

    }

    else {

        const removeButton =
            document.getElementById(
                "removePhotoButton"
            );


        if (removeButton) {

            removeButton.style.display =
                "none";

        }

    }

}


// ==========================================
// REMOVE PROFILE PHOTO
// ==========================================

function removeProfilePhoto() {

    const confirmRemove =
        confirm(
            "Remove your profile photo?"
        );


    if (!confirmRemove) {

        return;

    }


    localStorage.removeItem(
        "swipex_profile_photo"
    );


    const username =
        getUsername();


    const profile =
        JSON.parse(
            localStorage.getItem(
                "swipex_profile"
            )
        ) || {};


    const avatar =
        document.getElementById(
            "profileAvatar"
        );


    avatar.style.backgroundImage =
        "";


    avatar.classList.remove(
        "photo-avatar"
    );


    avatar.textContent =
        getInitials(
            profile.fullName ||
            username
        );


    const removeButton =
        document.getElementById(
            "removePhotoButton"
        );


    if (removeButton) {

        removeButton.style.display =
            "none";

    }


    const photoInput =
        document.getElementById(
            "profilePhotoInput"
        );


    if (photoInput) {

        photoInput.value = "";

    }

}


// ==========================================
// SAVE PROFILE
// ==========================================

document.getElementById(
    "profileForm"
).addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const profile = {

            fullName:
                document.getElementById(
                    "fullName"
                ).value.trim(),

            email:
                document.getElementById(
                    "email"
                ).value.trim(),

            phone:
                document.getElementById(
                    "phone"
                ).value.trim(),

            location:
                document.getElementById(
                    "location"
                ).value.trim(),

            headline:
                document.getElementById(
                    "headline"
                ).value.trim(),

            about:
                document.getElementById(
                    "about"
                ).value.trim(),

            skills:
                document.getElementById(
                    "skills"
                ).value.trim(),

            education:
                document.getElementById(
                    "education"
                ).value.trim(),

            experience:
                document.getElementById(
                    "experience"
                ).value.trim()

        };


        // Save profile

        localStorage.setItem(
            "swipex_profile",
            JSON.stringify(profile)
        );


        localStorage.setItem(
            "swipex_email",
            profile.email
        );


        // Update hero

        updateHero(
            profile.fullName,
            profile.email
        );


        // Save message

        const message =
            document.getElementById(
                "saveMessage"
            );


        message.textContent =
            "Profile saved successfully ✓";


        setTimeout(
            function() {

                message.textContent = "";

            },
            3000
        );

    }
);


// ==========================================
// RESUME INFORMATION
// ==========================================

function loadResumeInfo() {

    let resume = null;


    try {

        resume =
            JSON.parse(
                localStorage.getItem(
                    "resumeData"
                )
            );

    }

    catch (error) {

        resume = null;

    }


    const resumeStatus =
        document.getElementById(
            "resumeStatus"
        );


    const atsScore =
        document.getElementById(
            "atsScore"
        );


    if (!resume) {

        resumeStatus.textContent =
            "Not Uploaded";

        atsScore.textContent =
            "0%";

        return;

    }


    resumeStatus.textContent =
        "Uploaded ✓";


    atsScore.textContent =
        (
            Number(
                resume.ats_score
            ) || 0
        ) + "%";

}


// ==========================================
// APPLICATION COUNT
// ==========================================

function loadApplications() {

    try {

        const applications =
            JSON.parse(
                localStorage.getItem(
                    "applications"
                )
            ) || [];


        document.getElementById(
            "applicationsCount"
        ).textContent =
            applications.length;

    }

    catch (error) {

        document.getElementById(
            "applicationsCount"
        ).textContent =
            "0";

    }

}


// ==========================================
// BACK TO DASHBOARD
// ==========================================

function backToDashboard() {

    if (
        window.parent &&
        window.parent !== window &&
        typeof window.parent.loadPage === "function"
    ) {

        window.parent.loadPage(
            "home.html"
        );

        return;

    }


    window.location.href =
        "jobseeker.html";

}


// ==========================================
// START
// ==========================================

loadProfile();

loadApplications();