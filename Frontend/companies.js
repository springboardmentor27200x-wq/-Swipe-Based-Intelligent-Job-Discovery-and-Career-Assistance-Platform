const API =
    window.SWIPEX_API_URL ||
    "https://swipex-backend-iota.vercel.app";

let jobs = [];

const companyList =
    document.getElementById("companyList");


// =========================
// LOAD COMPANIES
// =========================

async function getCompanies() {

    try {

        const response =
            await fetch(`${API}/jobs`);

        if (!response.ok) {

            throw new Error(
                "Failed to load jobs"
            );

        }

        jobs =
            await response.json();

        loadCompanies();

    }

    catch (error) {

        console.error(
            "Company loading error:",
            error
        );

        companyList.innerHTML = `

            <div class="empty-state">

                <div class="icon">
                    ⚠️
                </div>

                <h2>
                    Unable to Load Companies
                </h2>

                <p>
                    Please make sure the backend
                    server is running.
                </p>

            </div>

        `;

    }

}


// =========================
// DISPLAY COMPANIES
// =========================

function loadCompanies(list = jobs) {

    companyList.innerHTML = "";


    // Remove duplicate companies

    const uniqueCompanies = [];


    list.forEach(job => {

        if (
            job.company &&
            !uniqueCompanies.some(
                company =>
                    company.company ===
                    job.company
            )
        ) {

            uniqueCompanies.push(job);

        }

    });


    // Update count

    const countElement =
        document.getElementById(
            "companyCount"
        );


    if (countElement) {

        countElement.textContent =
            `${uniqueCompanies.length} ${
                uniqueCompanies.length === 1
                    ? "Company"
                    : "Companies"
            }`;

    }


    // Empty state

    if (
        uniqueCompanies.length === 0
    ) {

        companyList.innerHTML = `

            <div class="empty-state">

                <div class="icon">
                    🔎
                </div>

                <h2>
                    No Companies Found
                </h2>

                <p>
                    Try searching for another company.
                </p>

            </div>

        `;

        return;

    }


    // Create company cards

    uniqueCompanies.forEach(
        company => {

            const companyJobs =
                list.filter(
                    job =>
                        job.company ===
                        company.company
                );


            const initial =
                company.company
                    .charAt(0)
                    .toUpperCase();


            companyList.innerHTML += `

                <div
                    class="company-card"
                    onclick="openCompany('${escapeQuotes(company.company)}')">

                    <div class="company-top">

                        <div class="company-logo">
                            ${initial}
                        </div>

                        <div class="company-info">

                            <h2>
                                ${escapeHtml(
                                    company.company
                                )}
                            </h2>

                            <p>
                                📍 ${
                                    escapeHtml(
                                        company.location ||
                                        "Multiple Locations"
                                    )
                                }
                            </p>

                        </div>

                    </div>


                    <div class="company-bottom">

                        <span class="job-count">

                            💼 ${
                                companyJobs.length
                            }
                            ${
                                companyJobs.length === 1
                                    ? "Job"
                                    : "Jobs"
                            }

                        </span>


                        <span class="view-jobs">

                            View Jobs →

                        </span>

                    </div>

                </div>

            `;

        }
    );

}


// =========================
// SEARCH COMPANY
// =========================

function searchCompany() {

    const search =
        document
            .getElementById(
                "searchCompany"
            )
            .value
            .trim()
            .toLowerCase();


    const filtered =
        jobs.filter(
            job =>
                (
                    job.company ||
                    ""
                )
                .toLowerCase()
                .includes(search)
        );


    loadCompanies(filtered);

}


// =========================
// OPEN COMPANY JOBS
// =========================

function openCompany(company) {

    localStorage.setItem(
        "selectedCompany",
        company
    );


    /*
        Keep the existing flow:
        Companies → Jobs
    */

    window.location.href =
        "jobs.html";

}


// =========================
// DASHBOARD
// =========================

function backToDashboard() {

    // If companies.html is inside jobseeker.html iframe
    if (window.parent && window.parent !== window) {

        try {

            // First try the dashboard's loadPage function
            if (typeof window.parent.loadPage === "function") {

                window.parent.loadPage("home.html");
                return;

            }

        } catch (error) {

            console.log("loadPage unavailable:", error);

        }


        try {

            // Directly change the parent's iframe
            const frame =
                window.parent.document.getElementById("contentFrame");

            if (frame) {

                frame.src = "home.html";
                return;

            }

        } catch (error) {

            console.log("Cannot access parent iframe:", error);

        }


        // Final fallback
        window.parent.postMessage(
            {
                action: "loadPage",
                page: "home.html"
            },
            "*"
        );

        return;
    }


    // If companies.html is opened directly
    window.location.href = "jobseeker.html";
}

// =========================
// HTML ESCAPE
// =========================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value;

    return div.innerHTML;

}


// =========================
// ESCAPE COMPANY NAME
// FOR ONCLICK
// =========================

function escapeQuotes(value) {

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");

}


// =========================
// START
// =========================

getCompanies();