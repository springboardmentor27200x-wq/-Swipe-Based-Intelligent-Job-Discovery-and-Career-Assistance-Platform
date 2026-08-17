// =====================================================
// SWIPEX API CONFIGURATION
// =====================================================

(function () {

    const hostname =
        window.location.hostname;


    const isLocal =
        hostname === "127.0.0.1" ||
        hostname === "localhost" ||
        hostname === "";


    if (isLocal) {

        window.SWIPEX_API_URL =
            "http://127.0.0.1:8000";

    }

    else {

        /*
            After deploying the backend,
            replace this ONE URL only.

            Example:
            https://swipex-api.onrender.com
        */

        window.SWIPEX_API_URL =
            "https://YOUR-BACKEND-URL.onrender.com";

    }

})();