const API_URL =
    window.SWIPEX_API_URL;

// ==========================================
// ADD JOB
// ==========================================

document.getElementById(
    "jobForm"
).addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const message =
            document.getElementById(
                "message"
            );


        message.textContent =
            "Publishing job...";

        message.style.color =
            "#60A5FA";


        const jobData = {

            company:
                document.getElementById(
                    "company"
                ).value.trim(),

            title:
                document.getElementById(
                    "title"
                ).value.trim(),

            location:
                document.getElementById(
                    "location"
                ).value.trim(),

            salary:
                document.getElementById(
                    "salary"
                ).value.trim(),

            experience:
                document.getElementById(
                    "experience"
                ).value.trim(),

            description:
                buildDescription()

        };


        try {

            const response =
                await fetch(
                    `${API_URL}/jobs`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                jobData
                            )
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Failed to create job"
                );

            }


            message.textContent =
                "✓ Job published successfully!";


            message.style.color =
                "#22C55E";


            document.getElementById(
                "jobForm"
            ).reset();


            setTimeout(
                function() {

                    backToRecruiterDashboard();

                },
                1200
            );


        }
        catch(error) {

            console.error(
                "Add job error:",
                error
            );


            message.textContent =
                "✕ " + error.message;


            message.style.color =
                "#F87171";

        }

    }
);


// ==========================================
// BUILD DESCRIPTION
// ==========================================

function buildDescription() {

    const description =
        document.getElementById(
            "description"
        ).value.trim();


    const skills =
        document.getElementById(
            "skills"
        ).value.trim();


    const jobType =
        document.getElementById(
            "jobType"
        ).value;


    let finalDescription =
        description;


    if (jobType) {

        finalDescription +=
            `\n\nJob Type: ${jobType}`;

    }


    if (skills) {

        finalDescription +=
            `\n\nRequired Skills: ${skills}`;

    }


    return finalDescription;

}


// =====================================
// BACK TO RECRUITER DASHBOARD
// =====================================

function backToRecruiterDashboard() {

    // If Add Job is opened inside recruiter dashboard iframe
    if (window.parent && window.parent !== window) {

        window.parent.document.getElementById("contentFrame").src =
            "recruiter_home.html";

        return;
    }

    // If opened directly
    window.location.href = "recruiter.html";

}