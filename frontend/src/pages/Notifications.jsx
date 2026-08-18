import { useEffect, useState } from "react";
import axios from "../api";
import Sidebar from "../components/Sidebar";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("notifications/", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access")}`,
  },
});

console.log("NOTIFICATIONS RESPONSE:", res.data);

setNotifications(res.data);
    } catch (err) {
      console.log("Notification Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "startup":
        return "🚀";

      case "recommendation":
        return "🤖";

      case "match":
        return "🎯";

      case "competition":
        return "🔥";

      default:
        return "🔔";
    }
  };

  return (
    <div className="flex">

      <Sidebar />

      <div className="ml-64 flex-1 p-10 bg-gray-100 min-h-screen">

        <h1 className="text-4xl font-bold mb-8">
          🔔 Notifications
        </h1>

        {loading ? (
          <p className="text-gray-500">
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (

          <div className="bg-white rounded-xl shadow p-8">
            <p className="text-gray-500 text-lg">
              🎉 No new notifications.
            </p>
          </div>

        ) : (

          <div className="space-y-4">

            {notifications.map((notification) => (

              <div
                key={notification.id}
                className="bg-white rounded-xl shadow p-6"
              >

                <div className="flex items-start gap-4">

                  <div className="text-3xl">
                    {getIcon(notification.notification_type)}
                  </div>

                  <div className="flex-1">

                    <h2 className="text-xl font-bold">
                      {notification.title}
                    </h2>

                    <p className="text-gray-600 mt-2">
                      {notification.message}
                    </p>

                    <p className="text-sm text-gray-400 mt-3">
                      {new Date(
                        notification.created_at
                      ).toLocaleString()}
                    </p>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>
    </div>
  );
}