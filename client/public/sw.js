self.addEventListener("push", function (event) {
  console.log("Push event received:", event);

  if (event.data) {
    try {
      // Try to parse as JSON first
      let data;
      try {
        data = event.data.json();
      } catch (e) {
        // If JSON parsing fails, try to parse as text
        const textData = event.data.text();
        console.log("Received text data:", textData);

        // Try to extract JSON from SNS format
        try {
          const snsData = JSON.parse(textData);
          if (snsData.Message) {
            // SNS sends the actual message in the Message field
            data = JSON.parse(snsData.Message);
          } else {
            data = snsData;
          }
        } catch (e2) {
          // Fallback: create notification from raw text
          data = {
            title: "絵葉書通知",
            body: textData,
          };
        }
      }

      const options = {
        body: data.body || data.message || "新しい通知があります",
        icon: data.icon || "/icon-512x512.png",
        badge: "/icon-512x512.png",
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: "postcard-notification",
          url: data.url || "/collection", // Default to collection page
        },
        requireInteraction: true, // Keep notification visible until user interacts
        actions: [
          {
            action: "view",
            title: "確認する",
          },
        ],
      };

      const title = data.title || "Postcard";

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (error) {
      console.error("Error processing push event:", error);

      // Fallback notification
      const fallbackOptions = {
        body: "新しい通知があります",
        icon: "/icon-512x512.png",
        badge: "/icon-512x512.png",
        data: {
          dateOfArrival: Date.now(),
          primaryKey: "postcard-notification-fallback",
        },
      };

      event.waitUntil(
        self.registration.showNotification("Postcard", fallbackOptions),
      );
    }
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received:", event);

  event.notification.close();

  let urlToOpen = event.notification.data?.url || "/collection";

  // Handle action buttons
  if (event.action === "view") {
    urlToOpen = "/collection";
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }

        // If no existing window/tab with target URL, open a new one
        if (clients.openWindow) {
          const baseUrl = self.location.origin;
          return clients.openWindow(baseUrl + urlToOpen);
        }
      }),
  );
});

// Handle notification close event
self.addEventListener("notificationclose", function (event) {
  console.log("Notification closed:", event);
});
