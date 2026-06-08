// Real-time synchronization utility using BroadcastChannel API.
// Allows instantaneous communication between the Control Panel and Display Screen.

const CHANNEL_NAME = 'go_station_sync_channel';
let channel = null;

function getChannel() {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export const sync = {
  /**
   * Broadcasts an event to all open tabs/windows running the app
   * @param {string} eventType - The type of event (e.g. 'PLAYLIST_CHANGED', 'SETTINGS_CHANGED', 'TICKER_CHANGED')
   * @param {any} payload - Optional data to send with the event
   */
  broadcast(eventType, payload = {}) {
    try {
      const ch = getChannel();
      ch.postMessage({
        type: eventType,
        payload,
        sender: 'dashboard',
        timestamp: Date.now()
      });
      console.log(`[Sync] Broadcasted event: ${eventType}`, payload);
    } catch (err) {
      console.error('[Sync] Error broadcasting message:', err);
    }
  },

  /**
   * Subscribes to broadcasted events
   * @param {function} callback - Callback function called when an event is received: (eventData) => {}
   * @returns {function} Unsubscribe function
   */
  subscribe(callback) {
    try {
      const ch = getChannel();
      const handler = (event) => {
        if (event.data) {
          callback(event.data);
        }
      };
      ch.addEventListener('message', handler);
      return () => {
        ch.removeEventListener('message', handler);
      };
    } catch (err) {
      console.error('[Sync] Error subscribing to channel:', err);
      return () => {};
    }
  },

  /**
   * Close the channel connection
   */
  close() {
    if (channel) {
      channel.close();
      channel = null;
    }
  }
};
