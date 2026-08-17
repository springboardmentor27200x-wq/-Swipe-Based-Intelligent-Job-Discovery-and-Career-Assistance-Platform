const API_URL =
    window.SWIPEX_API_URL;


const list =
    document.getElementById(
        "applicationsList"
    );


// ==========================================
// LOAD APPLICANTS
// ==========================================

async function loadApplicants() {

    if (!list) return;


    list.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                ⏳
            </div>

            <h2>
                Loading Applicants...
            </h2>

        </div>

    `;


    try {

        const response =
            await fetch(
                `${API_URL}/applicants`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load applicants"
            );

        }


        const applicants =
            await response.json();


        displayApplicants(
            applicants
        );

    }
    catch(error) {

        console.error(
            "Applicant error:",
            error
        );


        list.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h2>
                    Unable to Load Applicants
                </h2>

                <p>
                    Please make sure the backend is running.
                </p>

            </div>

        `;

    }

}


// ==========================================
// DISPLAY APPLICANTS
// ==========================================

function displayApplicants(
    applicants
) {

    list.innerHTML = "";


    if (
        !applicants ||
        applicants.length === 0
    ) {

        list.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    👥
                </div>

                <h2>
                    No Applicants Yet
                </h2>

                <p>
                    Applications from job seekers
                    will appear here when they apply
                    for your jobs.
                </p>

            </div>

        `;

        return;

    }


    applicants.forEach(
        function(applicant) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "application-card";


            const status =
                applicant.status ||
                "Pending";


            const statusClass =
                status.toLowerCase();


            let statusHTML = "";


            if (
                status === "Pending"
            ) {

                statusHTML = `

                    <div class="application-actions">

                        <button
                            class="accept-button"
                            onclick="updateApplication(
                                ${applicant.application_id},
                                'accept'
                            )">

                            ✓ Accept

                        </button>


                        <button
                            class="reject-button"
                            onclick="updateApplication(
                                ${applicant.application_id},
                                'reject'
                            )">

                            ✕ Reject

                        </button>

                    </div>

                `;

            }


            else if (
                status === "Accepted"
            ) {

                statusHTML = `

                    <div class="decision accepted">

                        ✓ Application Accepted

                    </div>

                `;

            }


            else if (
                status === "Rejected"
            ) {

                statusHTML = `

                    <div class="decision rejected">

                        ✕ Application Rejected

                    </div>

                `;

            }


            card.innerHTML = `

                <div class="application-icon">
                    👤
                </div>


                <div class="application-details">

                    <h2>
                        ${escapeHTML(
                            applicant.username
                        )}
                    </h2>


                    <p>

                        📧

                        <strong>
                            Email:
                        </strong>

                        ${escapeHTML(
                            applicant.email
                        )}

                    </p>


                    <p>

                        💼

                        <strong>
                            Position:
                        </strong>

                        ${escapeHTML(
                            applicant.job
                        )}

                    </p>


                    <p>

                        🏢

                        <strong>
                            Company:
                        </strong>

                        ${escapeHTML(
                            applicant.company
                        )}

                    </p>


                    <p>

                        📍

                        <strong>
                            Location:
                        </strong>

                        ${escapeHTML(
                            applicant.location
                        )}

                    </p>


                    <p>

                        📄

                        <strong>
                            Resume:
                        </strong>

                        ${
                            applicant.resume
                            ?
                            escapeHTML(
                                applicant.resume
                            )
                            :
                            "Not uploaded"
                        }

                    </p>


                    <p>

                        <strong>
                            Status:
                        </strong>

                        <span
                            class="status-text ${statusClass}">

                            ${escapeHTML(
                                status
                            )}

                        </span>

                    </p>


                    ${statusHTML}

                </div>

            `;


            list.appendChild(
                card
            );

        }
    );

}


// ==========================================
// ACCEPT / REJECT
// ==========================================

async function updateApplication(
    applicationId,
    decision
) {

    const actionText =
        decision === "accept"
            ? "accept"
            : "reject";


    const confirmed =
        confirm(
            `Are you sure you want to ${actionText} this application?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(

                `${API_URL}/applications/${applicationId}/${decision}`,

                {
                    method: "PUT"
                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to update application"
            );

        }


        alert(
            data.message
        );


        await loadApplicants();

    }
    catch(error) {

        console.error(
            "Application update error:",
            error
        );


        alert(
            error.message
        );

    }

}


// ==========================================
// BACK TO DASHBOARD
// ==========================================

function goBackToDashboard() {

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
        "recruiter_home.html";

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ==========================================
// START
// ==========================================

loadApplicants();