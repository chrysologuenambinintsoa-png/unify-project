import { useState, useCallback, useEffect, useRef } from 'react';

export interface NotificationData {
  id: string;
  type: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  content: string;
  url?: string | null;
  time: string;
  read: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const initialFetchDoneRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/notifications', {
          headers: {
            'Cache-Control': 'no-cache',
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const statusText = response.statusText || 'Unknown error';
          const message = errorData.error || `HTTP ${response.status}: ${statusText}`;
          
          // If it's a 503 (Service Unavailable), retry
          if (response.status === 503 && attempt < MAX_RETRIES - 1) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.warn(`Notifications API unavailable (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          console.error('Notifications API error:', {
            status: response.status,
            message,
            hasErrorData: !!errorData.error,
            attempt: attempt + 1,
          });
          
          throw new Error(message);
        }

        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        return; // Success, exit the retry loop
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('An error occurred while fetching notifications');
        
        // If it's the last attempt, set the error
        if (attempt === MAX_RETRIES - 1) {
          setError(lastError.message);
          console.error('Error fetching notifications after retries:', err);
          setNotifications([]);
        }
        // Otherwise continue to the next retry
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const MAX_RETRIES = 2;
      
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const response = await fetch(
            `/api/notifications/${notificationId}/read`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          if (!response.ok) {
            // Retry on 503
            if (response.status === 503 && attempt < MAX_RETRIES - 1) {
              const delay = Math.pow(2, attempt) * 500; // 500ms, 1s
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to mark notification as read`);
          }

          const data = await response.json();

          // Update the notification in the list
          setNotifications(prev =>
            prev.map(notif =>
              notif.id === notificationId
                ? { ...notif, read: true }
                : notif
            )
          );

          // Update unread count
          setUnreadCount(data.unreadCount || 0);
          return; // Success, exit retry loop
        } catch (err) {
          if (attempt === MAX_RETRIES - 1) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
            setError(errorMessage);
            console.error('Error marking notification as read:', err);
          }
        }
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    const MAX_RETRIES = 2;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ all: true })
        });

        if (!response.ok) {
          // Retry on 503
          if (response.status === 503 && attempt < MAX_RETRIES - 1) {
            const delay = Math.pow(2, attempt) * 500; // 500ms, 1s
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw new Error('Failed to mark all notifications as read');
        }

        // Update all notifications
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read: true }))
        );

        // Reset unread count
        setUnreadCount(0);
        return; // Success, exit retry loop
      } catch (err) {
        if (attempt === MAX_RETRIES - 1) {
          console.error('Error marking all notifications as read:', err);
        }
      }
    }
  }, []);

  // Setup SSE connection for real-time notifications
  useEffect(() => {
    const setupSSE = () => {
      try {
        // Close existing connection if any
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        eventSourceRef.current = new EventSource('/api/realtime/notifications');

        eventSourceRef.current.addEventListener('notification', (event: any) => {
          try {
            const newNotification = JSON.parse(event.data);
            // Add new notification to the top
            setNotifications(prev => [newNotification, ...prev]);
            // Increment unread count
            setUnreadCount(prev => prev + 1);
          } catch (err) {
            console.error('Error parsing notification event:', err);
          }
        });

        eventSourceRef.current.onerror = () => {
          console.warn('SSE connection error, will retry on next interval');
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          // Retry after 5 seconds
          setTimeout(setupSSE, 5000);
        };
      } catch (err) {
        console.error('Error setting up SSE:', err);
      }
    };

    setupSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Fetch on mount - only once
  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      fetchNotifications();
    }
  }, []); // Empty dependency array to run only on mount

  // Auto-refresh disabled - only manual refresh allowed (SSE handles real-time updates)

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
};
