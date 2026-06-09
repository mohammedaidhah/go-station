import { createClient } from '@supabase/supabase-js';

const CHANNEL_NAME = 'go_station_sync_channel';

// Get credentials from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let broadcastChannel = null;
let supabaseClient = null;
let supabaseChannel = null;

// Initialize BroadcastChannel fallback
function getBroadcastChannel() {
  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
  return broadcastChannel;
}

// Initialize Supabase if keys are provided
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    supabaseChannel = supabaseClient.channel('go_station_sync');
    console.log('[Sync] Cloud sync (Supabase) initialized successfully.');
  } catch (err) {
    console.error('[Sync] Error initializing Supabase:', err);
  }
} else {
  console.log('[Sync] No Supabase credentials found. Falling back to local BroadcastChannel.');
}

export const sync = {
  /**
   * Broadcasts an event to all open tabs/windows and remote devices
   * @param {string} eventType - The type of event (e.g. 'PLAYLIST_CHANGED', 'SETTINGS_CHANGED', 'TICKER_CHANGED')
   * @param {any} payload - Optional data to send with the event
   */
  broadcast(eventType, payload = {}) {
    // 1. Broadcast locally
    try {
      const bc = getBroadcastChannel();
      bc.postMessage({
        type: eventType,
        payload,
        sender: 'dashboard',
        timestamp: Date.now()
      });
      console.log(`[Sync] Local Broadcasted event: ${eventType}`, payload);
    } catch (err) {
      console.error('[Sync] Local Broadcast Error:', err);
    }

    // 2. Broadcast via Supabase (Cloud) if configured
    if (supabaseChannel) {
      supabaseChannel.send({
        type: 'broadcast',
        event: eventType,
        payload: {
          payload,
          timestamp: Date.now()
        }
      }).then((status) => {
        console.log(`[Sync] Cloud Broadcasted event: ${eventType} (${status})`, payload);
      }).catch((err) => {
        console.error('[Sync] Cloud Broadcast Error:', err);
      });
    }
  },

  /**
   * Subscribes to broadcasted events (handles both local and cloud)
   * @param {function} callback - Callback function called when an event is received: (eventData) => {}
   * @returns {function} Unsubscribe function
   */
  subscribe(callback) {
    const unsubscribes = [];

    // 1. Subscribe locally
    try {
      const bc = getBroadcastChannel();
      const handler = (event) => {
        if (event.data) {
          callback(event.data);
        }
      };
      bc.addEventListener('message', handler);
      unsubscribes.push(() => bc.removeEventListener('message', handler));
    } catch (err) {
      console.error('[Sync] Local Subscription Error:', err);
    }

    // 2. Subscribe via Supabase (Cloud) if configured
    if (supabaseChannel) {
      try {
        const channelSub = supabaseChannel
          .on('broadcast', { event: '*' }, (message) => {
            console.log('[Sync] Received Cloud Event:', message.event, message.payload);
            callback({
              type: message.event,
              payload: message.payload?.payload || {},
              sender: 'dashboard',
              timestamp: message.payload?.timestamp || Date.now()
            });
          })
          .subscribe((status) => {
            console.log(`[Sync] Supabase Channel Subscription Status: ${status}`);
          });

        unsubscribes.push(() => {
          supabaseClient.removeChannel(channelSub);
        });
      } catch (err) {
        console.error('[Sync] Cloud Subscription Error:', err);
      }
    }

    // Return compound unsubscribe function
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  },

  /**
   * Close all connections
   */
  close() {
    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }
    if (supabaseClient && supabaseChannel) {
      supabaseClient.removeChannel(supabaseChannel);
      supabaseChannel = null;
      supabaseClient = null;
    }
  }
};
