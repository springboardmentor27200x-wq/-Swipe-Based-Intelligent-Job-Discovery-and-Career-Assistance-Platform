const API_URL =
    window.SWIPEX_API_URL;


// =====================================================
// PAGE TITLES
// =====================================================

const pageTitles = {

    "home.html":
        "Dashboard",

    "jobs.html":
        "Browse Jobs",

    "recommendations.html":
        "Recommended Jobs",

    "companies.html":
        "Companies",

    "savedjobs.html":
        "Saved Jobs",

    "resume.html":
        "Resume",

    "applications.html":
        "Applications",

    "analytics.html":
        "Career Analytics",

    "profile.html":
        "My Profile",

    "notifications.html":
        "Notifications"

};


// =====================================================
// NOTIFICATION STATE
// =====================================================

let knownNotificationIds =
    new Set();


let notificationsInitialized =
    false;


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
// LOAD PAGE
// =====================================================

function loadPage(
    page,
    clickedButton
) {

    console.log(
        "Loading page:",
        page
    );


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


    // =================================================
    // ACTIVE SIDEBAR
    // =================================================

    const buttons =
        document.querySelectorAll(
            ".sidebar-menu button"
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


    // =================================================
    // PAGE TITLE
    // =================================================

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


    loadHeaderProfilePhoto();


    closeNotificationPanel();

}


// =====================================================
// IFRAME MESSAGES
// =====================================================

window.addEventListener(
    "message",
    function(event) {

        if (!event.data) {

            return;

        }


        // =================================================
        // PAGE NAVIGATION
        // =================================================

        if (
            event.data.action ===
            "loadPage"
            &&
            event.data.page
        ) {

            loadPage(
                event.data.page
            );

            return;

        }


        // =================================================
        // PROFILE PHOTO UPDATED
        // =================================================

        if (
            event.data ===
            "profilePhotoUpdated"
        ) {

            loadHeaderProfilePhoto();

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


            loadHeaderProfilePhoto();

        }

    }
);


// =====================================================
// LOAD ALL NOTIFICATIONS PAGE
// =====================================================

function loadNotificationsPage() {

    loadPage(
        "notifications.html"
    );

}


// =====================================================
// TOGGLE NOTIFICATION PANEL
// =====================================================

function toggleNotifications() {

    enableBrowserNotifications();


    const panel =
        document.getElementById(
            "notificationPanel"
        );


    const overlay =
        document.getElementById(
            "notificationOverlay"
        );


    if (
        !panel ||
        !overlay
    ) {

        return;

    }


    if (
        panel.classList.contains(
            "show"
        )
    ) {

        closeNotificationPanel();

    }

    else {

        openNotificationPanel();

    }

}


// =====================================================
// OPEN NOTIFICATION PANEL
// =====================================================

function openNotificationPanel() {

    const panel =
        document.getElementById(
            "notificationPanel"
        );


    const overlay =
        document.getElementById(
            "notificationOverlay"
        );


    if (
        !panel ||
        !overlay
    ) {

        return;

    }


    panel.classList.add(
        "show"
    );


    overlay.classList.add(
        "show"
    );


    loadNotifications();

}


// =====================================================
// CLOSE NOTIFICATION PANEL
// =====================================================

function closeNotificationPanel() {

    const panel =
        document.getElementById(
            "notificationPanel"
        );


    const overlay =
        document.getElementById(
            "notificationOverlay"
        );


    if (panel) {

        panel.classList.remove(
            "show"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "show"
        );

    }

}


// =====================================================
// ENABLE BROWSER NOTIFICATIONS
// =====================================================

async function enableBrowserNotifications() {

    if (
        !("Notification" in window)
    ) {

        return false;

    }


    if (
        Notification.permission ===
        "granted"
    ) {

        return true;

    }


    if (
        Notification.permission ===
        "denied"
    ) {

        return false;

    }


    try {

        const permission =
            await Notification.requestPermission();


        return (
            permission ===
            "granted"
        );

    }

    catch(error) {

        console.error(
            "Notification permission error:",
            error
        );


        return false;

    }

}


// =====================================================
// BROWSER NOTIFICATION
// =====================================================

function showBrowserNotification(
    notification
) {

    if (
        !("Notification" in window)
    ) {

        return;

    }


    if (
        Notification.permission !==
        "granted"
    ) {

        return;

    }


    const browserNotification =
        new Notification(

            notification.title ||
            "SwipeX Notification",

            {

                body:
                    notification.message ||
                    "You have a new notification.",

                tag:
                    "swipex-notification-" +
                    notification.id

            }

        );


    browserNotification.onclick =
        function() {

            window.focus();


            openNotificationPanel();


            browserNotification.close();

        };

}


// =====================================================
// CHECK FOR NEW NOTIFICATIONS
// =====================================================

function checkForNewNotifications(
    notifications
) {

    if (
        !Array.isArray(
            notifications
        )
    ) {

        return;

    }


    // =================================================
    // FIRST LOAD
    // =================================================

    if (
        !notificationsInitialized
    ) {

        notifications.forEach(
            function(notification) {

                if (
                    notification.id !==
                    undefined
                    &&
                    notification.id !==
                    null
                ) {

                    knownNotificationIds.add(
                        notification.id
                    );

                }

            }
        );


        notificationsInitialized =
            true;


        return;

    }


    // =================================================
    // CHECK NEW
    // =================================================

    notifications.forEach(
        function(notification) {

            if (
                notification.id ===
                undefined
                ||
                notification.id ===
                null
            ) {

                return;

            }


            if (
                !knownNotificationIds.has(
                    notification.id
                )
            ) {

                knownNotificationIds.add(
                    notification.id
                );


                if (
                    notification.is_read ===
                    false
                ) {

                    showBrowserNotification(
                        notification
                    );

                }

            }

        }
    );

}


// =====================================================
// LOAD NOTIFICATIONS
// =====================================================

async function loadNotifications() {

    const username =
        getUsername();


    if (!username) {

        console.log(
            "No username found."
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


        console.log(
            "Job seeker notifications:",
            notifications
        );


        checkForNewNotifications(
            notifications
        );


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

                <div class="no-notifications">

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

    const list =
        document.getElementById(
            "notificationList"
        );


    const badge =
        document.getElementById(
            "notificationCount"
        );


    const summary =
        document.getElementById(
            "notificationSummary"
        );


    if (!list) {

        return;

    }


    list.innerHTML =
        "";


    // =================================================
    // EMPTY
    // =================================================

    if (
        !Array.isArray(
            notifications
        )
        ||
        notifications.length === 0
    ) {

        list.innerHTML = `

            <div class="no-notifications">

                🎉 You're all caught up!

            </div>

        `;


        if (badge) {

            badge.classList.add(
                "hidden"
            );

        }


        if (summary) {

            summary.textContent =
                "No new notifications";

        }


        return;

    }


    let unread =
        0;


    notifications.forEach(
        function(notification) {


            if (
                notification.is_read ===
                false
            ) {

                unread++;

            }


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "notification-item";


            if (
                notification.is_read ===
                false
            ) {

                item.classList.add(
                    "unread"
                );

            }


            const title =
                notification.title ||
                "Notification";


            const message =
                notification.message ||
                "";


            // =================================================
            // NOTIFICATION HTML
            // =================================================

            item.innerHTML = `

                <button
                    type="button"
                    class="delete-notification-btn"
                    title="Delete notification">

                    🗑️

                </button>


                <h4>

                    ${escapeHtml(
                        title
                    )}

                </h4>


                <p>

                    ${escapeHtml(
                        message
                    )}

                </p>


                <small>

                    ${formatTime(
                        notification.created_at
                    )}

                </small>

            `;


            // =================================================
            // CLICK NOTIFICATION -> MARK READ
            // =================================================

            item.addEventListener(
                "click",
                function(event) {

                    /*
                        IMPORTANT:
                        Never process this click if it
                        originated from delete button.
                    */

                    if (
                        event.target.closest(
                            ".delete-notification-btn"
                        )
                    ) {

                        return;

                    }


                    if (
                        notification.is_read ===
                        false
                    ) {

                        markNotificationRead(
                            notification.id
                        );

                    }

                }
            );


            // =================================================
            // DELETE BUTTON
            // =================================================

            const deleteButton =
                item.querySelector(
                    ".delete-notification-btn"
                );


            if (deleteButton) {

                deleteButton.addEventListener(
                    "click",
                    function(event) {

                        /*
                            CRITICAL FIX:

                            Prevent this click from reaching
                            notification-item or anything
                            behind the notification panel.
                        */

                        event.preventDefault();

                        event.stopPropagation();

                        event.stopImmediatePropagation();


                        deleteNotification(
                            notification.id,
                            item
                        );

                    }
                );

            }


            list.appendChild(
                item
            );

        }
    );


    // =================================================
    // UPDATE BADGE
    // =================================================

    if (
        unread > 0
    ) {

        if (badge) {

            badge.textContent =
                unread;


            badge.classList.remove(
                "hidden"
            );

        }


        if (summary) {

            summary.textContent =
                `${unread} new notification${unread === 1 ? "" : "s"}`;

        }

    }

    else {

        if (badge) {

            badge.classList.add(
                "hidden"
            );

        }


        if (summary) {

            summary.textContent =
                "No new notifications";

        }

    }

}


// =====================================================
// DELETE NOTIFICATION
// =====================================================

async function deleteNotification(
    notificationId,
    notificationElement
) {

    try {

        console.log(
            "Deleting notification:",
            notificationId
        );


        const response =
            await fetch(

                `${API_URL}/notifications/${notificationId}`,

                {

                    method:
                        "DELETE"

                }

            );


        if (!response.ok) {

            const errorText =
                await response.text();


            throw new Error(
                errorText ||
                "Unable to delete notification"
            );

        }


        console.log(
            "Notification deleted successfully:",
            notificationId
        );


        // =================================================
        // REMOVE FROM SCREEN IMMEDIATELY
        // =================================================

        if (
            notificationElement &&
            notificationElement.parentNode
        ) {

            notificationElement.remove();

        }


        // =================================================
        // IMPORTANT
        // =================================================
        // We DO NOT:
        //
        // loadPage("home.html")
        // window.location.reload()
        // goBackToDashboard()
        // closeNotificationPanel()
        //
        // The user stays exactly where they are.
        // =================================================


        // Refresh notification data only

        await loadNotifications();

    }

    catch(error) {

        console.error(
            "Delete notification error:",
            error
        );


        alert(
            "Unable to delete notification."
        );

    }

}


// =====================================================
// MARK ONE READ
// =====================================================

async function markNotificationRead(
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


        await loadNotifications();

    }

    catch(error) {

        console.error(
            "Error marking notification:",
            error
        );

    }

}


// =====================================================
// MARK ALL READ
// =====================================================

async function markAllRead() {

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


        await loadNotifications();

    }

    catch(error) {

        console.error(
            "Error marking all notifications:",
            error
        );

    }

}


// =====================================================
// FORMAT TIME
// =====================================================

function formatTime(
    timestamp
) {

    if (!timestamp) {

        return "Recently";

    }


    const date =
        new Date(
            timestamp
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return "Recently";

    }


    return date.toLocaleString();

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
// USERNAME
// =====================================================

function loadUsername() {

    const username =
        getUsername();


    const element =
        document.getElementById(
            "headerUsername"
        );


    if (
        element &&
        username
    ) {

        element.textContent =
            username;

    }

}


// =====================================================
// PROFILE PHOTO
// =====================================================

function loadHeaderProfilePhoto() {

    const profileImage =
        document.getElementById(
            "headerProfileImage"
        );


    const profileInitials =
        document.getElementById(
            "headerProfileInitials"
        );


    if (
        !profileImage ||
        !profileInitials
    ) {

        return;

    }


    let imageData =
        localStorage.getItem(
            "swipex_profile_photo"
        );


    const username =
        getUsername();


    // =================================================
    // USER-SPECIFIC PHOTO
    // =================================================

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


    // =================================================
    // PHOTO EXISTS
    // =================================================

    if (imageData) {

        profileImage.src =
            imageData;


        profileImage.style.display =
            "block";


        profileInitials.style.display =
            "none";

    }


    // =================================================
    // NO PHOTO
    // =================================================

    else {

        profileImage.src =
            "";


        profileImage.style.display =
            "none";


        profileInitials.style.display =
            "flex";

    }

}


// =====================================================
// STORAGE PHOTO CHANGE
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

            loadHeaderProfilePhoto();

        }

    }
);


// =====================================================
// WINDOW FOCUS
// =====================================================

window.addEventListener(
    "focus",
    function() {

        loadHeaderProfilePhoto();

    }
);


// =====================================================
// IFRAME LOAD
// =====================================================

const contentFrame =
    document.getElementById(
        "contentFrame"
    );


if (contentFrame) {

    contentFrame.addEventListener(
        "load",
        function() {

            loadHeaderProfilePhoto();

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

            closeNotificationPanel();

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

        loadHeaderProfilePhoto();

        loadNotifications();

    }
);


// =====================================================
// REFRESH EVERY 10 SECONDS
// =====================================================

setInterval(
    function() {

        loadNotifications();

        loadHeaderProfilePhoto();

    },
    10000
);