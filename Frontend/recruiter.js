const API_URL =
    window.SWIPEX_API_URL;


// =====================================================
// PAGE TITLES
// =====================================================

const pageTitles = {

    "recruiter_home.html":
        "Recruiter Dashboard",

    "addjob.html":
        "Add New Job",

    "postedjobs.html":
        "Posted Jobs",

    "recruiter_applications.html":
        "Applicants",

    "recruiter_profile.html":
        "My Profile"

};


// =====================================================
// LOAD PAGE
// =====================================================

function loadPage(
    page,
    clickedButton
) {

    const frame =
        document.getElementById(
            "contentFrame"
        );


    if (!frame) {

        console.error(
            "contentFrame not found"
        );

        return;

    }


    frame.src =
        page;


    // ==========================================
    // SIDEBAR ACTIVE STATE
    // ==========================================

    const buttons =
        document.querySelectorAll(
            ".menu-item"
        );


    buttons.forEach(
        function(button) {

            button.classList.remove(
                "active"
            );

        }
    );


    if (clickedButton) {

        clickedButton.classList.add(
            "active"
        );

    }


    // ==========================================
    // PAGE TITLE
    // ==========================================

    const title =
        pageTitles[page];


    const pageTitle =
        document.getElementById(
            "pageTitle"
        );


    if (
        pageTitle &&
        title
    ) {

        pageTitle.textContent =
            title;

    }


    // ==========================================
    // PROFILE IMAGE REFRESH
    // ==========================================

    loadTopProfilePhoto();


    closeNotifications();

}


// =====================================================
// GET USERNAME
// =====================================================

function getUsername() {

    return (

        localStorage.getItem(
            "swipex_username"
        )

        ||

        localStorage.getItem(
            "username"
        )

        ||

        ""

    );

}


// =====================================================
// USERNAME
// =====================================================

function loadUsername() {

    const username =
        getUsername()
        ||
        "Recruiter";


    const welcomeName =
        document.getElementById(
            "welcomeName"
        );


    if (welcomeName) {

        welcomeName.textContent =
            username;

    }

}


// =====================================================
// LOAD TOP PROFILE PHOTO
// =====================================================

function loadTopProfilePhoto() {

    const profileImage =
        document.getElementById(
            "topProfileImage"
        );


    const profileInitial =
        document.getElementById(
            "topProfileInitial"
        );


    if (
        !profileImage ||
        !profileInitial
    ) {

        return;

    }


    /*
        First try the existing common key
        used by your profile pages.
    */

    let imageData =
        localStorage.getItem(
            "swipex_profile_photo"
        );


    /*
        Also support a username-specific
        photo if you later store it that way.
    */

    const username =
        getUsername();


    if (username) {

        const userPhoto =
            localStorage.getItem(
                `swipex_profile_photo_${username}`
            );


        if (userPhoto) {

            imageData =
                userPhoto;

        }

    }


    // ==========================================
    // PHOTO EXISTS
    // ==========================================

    if (imageData) {

        profileImage.src =
            imageData;


        profileImage.style.display =
            "block";


        profileInitial.style.display =
            "none";

    }


    // ==========================================
    // NO PHOTO
    // ==========================================

    else {

        profileImage.src =
            "";


        profileImage.style.display =
            "none";


        profileInitial.style.display =
            "flex";

    }

}


// =====================================================
// NOTIFICATION ELEMENTS
// =====================================================

const notificationPanel =
    document.getElementById(
        "notificationPanel"
    );


const notificationOverlay =
    document.getElementById(
        "notificationOverlay"
    );


// =====================================================
// TOGGLE NOTIFICATIONS
// =====================================================

function toggleNotifications() {

    if (!notificationPanel) {

        return;

    }


    const isOpen =
        notificationPanel.classList.contains(
            "open"
        );


    if (isOpen) {

        closeNotifications();

    }

    else {

        notificationPanel.classList.add(
            "open"
        );


        if (notificationOverlay) {

            notificationOverlay.classList.add(
                "show"
            );

        }


        loadRecruiterNotifications();

    }

}


// =====================================================
// CLOSE NOTIFICATIONS
// =====================================================

function closeNotifications() {

    if (notificationPanel) {

        notificationPanel.classList.remove(
            "open"
        );

    }


    if (notificationOverlay) {

        notificationOverlay.classList.remove(
            "show"
        );

    }

}


// =====================================================
// LOAD RECRUITER NOTIFICATIONS
// =====================================================

async function loadRecruiterNotifications() {

    const username =
        getUsername();


    if (!username) {

        console.log(
            "Recruiter username not found."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/notifications/${encodeURIComponent(username)}`,
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load notifications"
            );

        }


        const notifications =
            await response.json();


        displayNotifications(
            notifications
        );

    }

    catch(error) {

        console.error(
            "Notification error:",
            error
        );


        const list =
            document.getElementById(
                "notificationList"
            );


        if (list) {

            list.innerHTML = `

                <div class="notification-empty">

                    Unable to load notifications.

                </div>

            `;

        }

    }

}


// =====================================================
// DISPLAY NOTIFICATIONS
// =====================================================

function displayNotifications(
    notifications
) {

    const notificationList =
        document.getElementById(
            "notificationList"
        );


    if (!notificationList) {

        return;

    }


    notificationList.innerHTML =
        "";


    if (
        !Array.isArray(
            notifications
        )
        ||
        notifications.length === 0
    ) {

        notificationList.innerHTML = `

            <div class="notification-empty">

                🔔

                <br><br>

                No Notifications

                <br><br>

                You're all caught up.

            </div>

        `;


        updateNotificationCount(
            []
        );


        return;

    }


    notifications.forEach(
        function(notification) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "notification-card";


            if (
                notification.is_read ===
                false
            ) {

                card.classList.add(
                    "unread"
                );

            }


            let icon =
                "🔔";


            let iconClass =
                "blue";


            const title =
                String(
                    notification.title ||
                    ""
                )
                .toLowerCase();


            if (
                title.includes(
                    "applicant"
                )
                ||
                title.includes(
                    "application"
                )
            ) {

                icon =
                    "👥";

                iconClass =
                    "purple";

            }


            else if (
                title.includes(
                    "job"
                )
            ) {

                icon =
                    "💼";

                iconClass =
                    "orange";

            }


            card.innerHTML = `

                <div
                    class="notification-card-icon ${iconClass}">

                    ${icon}

                </div>


                <div
                    class="notification-card-content">


                    <div
                        class="notification-card-title">


                        <strong>

                            ${escapeHtml(
                                notification.title ||
                                "Notification"
                            )}

                        </strong>


                        ${
                            notification.is_read ===
                            false

                            ?

                            `<span class="notification-dot"></span>`

                            :

                            ""
                        }


                    </div>


                    <p>

                        ${escapeHtml(
                            notification.message ||
                            ""
                        )}

                    </p>


                    <span
                        class="notification-time">

                        ${formatNotificationTime(
                            notification.created_at
                        )}

                    </span>


                </div>

            `;


            card.addEventListener(
                "click",
                function() {

                    markNotificationAsRead(
                        notification.id
                    );

                }
            );


            notificationList.appendChild(
                card
            );

        }
    );


    updateNotificationCount(
        notifications
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value == null
            ? ""
            : String(value);


    return div.innerHTML;

}


// =====================================================
// FORMAT NOTIFICATION TIME
// =====================================================

function formatNotificationTime(
    dateString
) {

    if (!dateString) {

        return "Recently";

    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Recently";

    }


    return date.toLocaleString();

}


// =====================================================
// MARK ONE NOTIFICATION AS READ
// =====================================================

async function markNotificationAsRead(
    notificationId
) {

    try {

        const response =
            await fetch(
                `${API_URL}/notifications/${notificationId}/read`,
                {
                    method:
                        "PUT"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to mark notification as read"
            );

        }


        await loadRecruiterNotifications();

    }

    catch(error) {

        console.error(
            "Read notification error:",
            error
        );

    }

}


// =====================================================
// MARK ALL AS READ
// =====================================================

async function markAllAsRead() {

    const username =
        getUsername();


    if (!username) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/notifications/${encodeURIComponent(username)}/read-all`,
                {
                    method:
                        "PUT"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to mark notifications as read"
            );

        }


        await loadRecruiterNotifications();

    }

    catch(error) {

        console.error(
            "Mark all read error:",
            error
        );

    }

}


// =====================================================
// UPDATE NOTIFICATION COUNT
// =====================================================

function updateNotificationCount(
    notifications
) {

    const unread =
        notifications.filter(
            function(notification) {

                return (
                    notification.is_read ===
                    false
                );

            }
        ).length;


    const badge =
        document.getElementById(
            "topNotificationBadge"
        );


    const summary =
        document.getElementById(
            "notificationSummary"
        );


    if (badge) {

        badge.textContent =
            unread;


        badge.style.display =
            unread > 0
                ? "flex"
                : "none";

    }


    if (summary) {

        summary.textContent =
            unread === 0

                ?

                "You're all caught up"

                :

                `${unread} new notification${unread === 1 ? "" : "s"}`;

    }

}


// =====================================================
// APPLICANT BADGE
// =====================================================

async function loadApplicantCount() {

    try {

        const response =
            await fetch(
                `${API_URL}/applicants`,
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            return;

        }


        const applicants =
            await response.json();


        const badge =
            document.getElementById(
                "applicantBadge"
            );


        if (!badge) {

            return;

        }


        const pendingCount =
            applicants.filter(
                function(applicant) {

                    return (

                        !applicant.status

                        ||

                        applicant.status ===
                        "Pending"

                    );

                }
            ).length;


        if (
            pendingCount > 0
        ) {

            badge.textContent =
                pendingCount;


            badge.style.display =
                "flex";

        }

        else {

            badge.style.display =
                "none";

        }

    }

    catch(error) {

        console.error(
            "Applicant count error:",
            error
        );

    }

}


// =====================================================
// PROFILE PHOTO MESSAGE FROM IFRAME
// =====================================================

window.addEventListener(
    "message",
    function(event) {

        if (!event.data) {

            return;

        }


        if (
            event.data ===
            "profilePhotoUpdated"
        ) {

            loadTopProfilePhoto();

            return;

        }


        if (
            event.data.type ===
            "PROFILE_PHOTO_UPDATED"
        ) {

            if (
                event.data.photo
            ) {

                localStorage.setItem(
                    "swipex_profile_photo",
                    event.data.photo
                );

            }


            loadTopProfilePhoto();

        }

    }
);


// =====================================================
// STORAGE PHOTO UPDATE
// =====================================================

window.addEventListener(
    "storage",
    function(event) {

        if (
            event.key ===
            "swipex_profile_photo"
            ||
            (
                event.key &&
                event.key.startsWith(
                    "swipex_profile_photo_"
                )
            )
        ) {

            loadTopProfilePhoto();

        }

    }
);


// =====================================================
// REFRESH PHOTO WHEN WINDOW GETS FOCUS
// =====================================================

window.addEventListener(
    "focus",
    function() {

        loadTopProfilePhoto();

    }
);


// =====================================================
// REFRESH PHOTO WHEN IFRAME LOADS
// =====================================================

const contentFrame =
    document.getElementById(
        "contentFrame"
    );


if (contentFrame) {

    contentFrame.addEventListener(
        "load",
        function() {

            loadTopProfilePhoto();

        }
    );

}


// =====================================================
// ESCAPE KEY
// =====================================================

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeNotifications();

        }

    }
);


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    localStorage.clear();


    window.location.href =
        "login.html";

}


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadUsername();

        loadTopProfilePhoto();

        loadRecruiterNotifications();

        loadApplicantCount();

    }
);


// =====================================================
// AUTO REFRESH
// =====================================================

setInterval(
    function() {

        loadRecruiterNotifications();

        loadApplicantCount();

        loadTopProfilePhoto();

    },
    10000
);