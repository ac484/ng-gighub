/**
 * Firebase Messaging Service Worker
 *
 * Handles background push notifications for GigHub application.
 * This service worker is registered by PushMessagingService and runs
 * independently from the main application thread.
 *
 * @features
 * - Background message handling when app is not in focus
 * - Click handling with smart navigation
 * - Notification customization with badges and actions
 * - Error resilience
 *
 * @version 20.0.1
 * @firebase-sdk 10.14.1
 */

// Import Firebase SDK scripts (compat mode for service workers)
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Initialize Firebase with project configuration
firebase.initializeApp({
  apiKey: 'AIzaSyCJ-eayGjJwBKsNIh3oEAG2GjbfTrvAMEI',
  authDomain: 'elite-chiller-455712-c4.firebaseapp.com',
  projectId: 'elite-chiller-455712-c4',
  storageBucket: 'elite-chiller-455712-c4.firebasestorage.app',
  messagingSenderId: '7807661688',
  appId: '1:7807661688:web:5f96a5fe30b799f31d1f8d',
  measurementId: 'G-5KJJ3DD2G7'
});

// Get messaging instance
const messaging = firebase.messaging();

/**
 * Handle background messages
 *
 * This handler is triggered when a push notification is received
 * while the app is in the background or closed.
 */
messaging.onBackgroundMessage(payload => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  try {
    // Extract notification content
    const notificationTitle = payload.notification?.title ?? payload.data?.title ?? 'GigHub 通知';
    const notificationBody = payload.notification?.body ?? payload.data?.body ?? '您有新的通知';
    const notificationIcon = payload.notification?.icon ?? payload.data?.icon ?? '/assets/logo.svg';
    const notificationBadge = payload.data?.badge ?? '/assets/badge.png';
    const notificationTag = payload.data?.tag ?? 'gighub-notification';
    const requireInteraction = payload.data?.requireInteraction === 'true';

    // Notification options
    const notificationOptions = {
      body: notificationBody,
      icon: notificationIcon,
      badge: notificationBadge,
      tag: notificationTag,
      requireInteraction: requireInteraction,
      data: {
        ...payload.data,
        timestamp: Date.now(),
        fcmMessageId: payload.fcmMessageId
      },
      // Optional actions (can be customized based on notification type)
      actions: payload.data?.actions
        ? JSON.parse(payload.data.actions)
        : [
            {
              action: 'open',
              title: '查看',
              icon: '/assets/icons/open.png'
            },
            {
              action: 'close',
              title: '關閉',
              icon: '/assets/icons/close.png'
            }
          ]
    };

    // Show notification
    return self.registration.showNotification(notificationTitle, notificationOptions);
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Failed to show notification:', error);

    // Fallback: Show simple notification
    return self.registration.showNotification('GigHub 通知', {
      body: '您有新的通知',
      icon: '/assets/logo.svg'
    });
  }
});

/**
 * Handle notification click events
 *
 * Smart navigation with action handling:
 * 1. Handle specific actions (mark-done, reply, etc.)
 * 2. If link is provided in data, navigate to that link
 * 3. If app window is already open, focus it
 * 4. Otherwise, open new window to app root
 */
self.addEventListener('notificationclick', event => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  // Close the notification
  event.notification.close();

  // Handle specific actions
  if (event.action) {
    console.log('[firebase-messaging-sw.js] Action clicked:', event.action);
    
    // Track action in IndexedDB for app to pick up
    event.waitUntil(
      self.registration.showNotification('操作已處理', {
        body: '您的操作已記錄',
        tag: 'action-confirmation',
        icon: '/assets/logo.svg',
        requireInteraction: false
      }).then(() => {
        // Post message to all clients
        return clients.matchAll({ type: 'window' }).then(clientList => {
          clientList.forEach(client => {
            client.postMessage({
              type: 'notification_action',
              action: event.action,
              data: event.notification.data
            });
          });
        });
      })
    );
    
    if (event.action === 'close') {
      return; // Just close, no navigation
    }
  }

  // Extract target URL from notification data
  const targetUrl = event.notification.data?.link ?? '/';
  const urlToOpen = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true
      })
      .then(clientList => {
        console.log('[firebase-messaging-sw.js] Found clients:', clientList.length);

        // Try to find existing window
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            console.log('[firebase-messaging-sw.js] Focusing existing window');
            return client.focus();
          }
        }

        // If no matching window found, try to focus any app window and navigate
        if (clientList.length > 0) {
          const client = clientList[0];
          console.log('[firebase-messaging-sw.js] Navigating existing window to:', urlToOpen);
          if ('navigate' in client) {
            return client.navigate(urlToOpen).then(client => client.focus());
          }
          return client.focus();
        }

        // No existing windows, open new one
        console.log('[firebase-messaging-sw.js] Opening new window:', urlToOpen);
        return clients.openWindow(urlToOpen);
      })
      .catch(error => {
        console.error('[firebase-messaging-sw.js] Failed to handle notification click:', error);
        // Fallback: Try to open root
        return clients.openWindow('/');
      })
  );
});

/**
 * Handle notification close events (for analytics)
 */
self.addEventListener('notificationclose', event => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event.notification.data);
  
  // Optional: Send analytics event or update notification status
  // This could be useful for tracking notification engagement
});

/**
 * Service worker activation
 * Clean up old caches if needed
 */
self.addEventListener('activate', event => {
  console.log('[firebase-messaging-sw.js] Service worker activated');
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

/**
 * Service worker installation
 */
self.addEventListener('install', event => {
  console.log('[firebase-messaging-sw.js] Service worker installed');
  // Skip waiting to activate immediately
  self.skipWaiting();
});
