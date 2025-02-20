export enum MessageType {
  LOADED = 'loaded',
  PLAY_TRACK = 'play-track',
  PAUSE_TRACK = 'pause-track',
  GET_POSITION = 'get-position',
  SEEK_TRACK = 'seek-track',
  SET_INFO = 'set-info',
  PERSIST_QUEUE = 'persist-queue',
  SET_REPEAT_MODE = 'set-repeat-mode',
  SHUFFLE = 'shuffle',

  // Linking
  OPEN_LINK = 'open-link',
  RELOAD = 'reload',
  ACCOUNT_RECOVERY = 'account-recovery',

  // Cast
  AIRPLAY = 'airplay',
  IS_CASTING = 'action/is-casting',

  SHOW_GOOGLE_CAST_PICKER = 'show-google-cast-picker',

  // Notifications
  ENABLE_PUSH_NOTIFICATIONS = 'enable-push-notifications',
  DISABLE_PUSH_NOTIFICATIONS = 'disable-push-notifications',
  RESET_NOTIFICATIONS_BADGE_COUNT = 'reset-notifications-badge-count',
  ENABLE_PUSH_NOTIFICATIONS_REMINDER = 'action/enable-push-notifications-reminder',
  PROMPT_PUSH_NOTIFICATION_REMINDER = 'prompt-push-notifications-reminder',

  OPEN_NOTIFICATIONS = 'open-notifications',
  FETCH_NOTIFICATIONS = 'fetch-notifications',
  FETCH_NOTIFICATIONS_SUCCESS = 'fetch-notifications-success',
  FETCH_NOTIFICATIONS_REPLACE = 'fetch-notifications-replace',
  FETCH_NOTIFICATIONS_FAILURE = 'fetch-notifications-failure',
  REFRESH_NOTIFICATIONS = 'refresh-notifications',
  MARK_ALL_NOTIFICATIONS_AS_VIEWED = 'mark-all-notifications-as-viewed',

  // Search
  OPEN_SEARCH = 'open-search',
  UPDATE_SEARCH_QUERY = 'update-search-query',
  SUBMIT_SEARCH_QUERY = 'submit-search-query',

  FETCH_SEARCH_SUCCESS = 'fetch-search-success',
  FETCH_SEARCH_FAILURE = 'fetch-search-failure',

  // Haptics
  HAPTIC_FEEDBACK = 'haptic-feedback',

  // Action dispatchers
  SYNC_QUEUE = 'action/sync-queue',
  SYNC_PLAYER = 'action/sync-player',
  PUSH_ROUTE = 'action/push-route',

  // OAuth
  REQUEST_INSTAGRAM_AUTH = 'request-instagram-auth',
  REQUEST_TIKTOK_AUTH = 'request-tiktok-auth',
  REQUEST_TWITTER_AUTH = 'request-twitter-auth',

  // Lifecycle
  ENTER_FOREGROUND = 'action/enter-foreground',
  BACKEND_SETUP = 'backend-setup',
  REQUEST_NETWORK_CONNECTED = 'request-network-connected',
  IS_NETWORK_CONNECTED = 'is-network-connected',
  SIGNED_IN = 'signed-in',

  // Keyboard
  KEYBOARD_VISIBLE = 'keyboard-visible',
  KEYBOARD_HIDDEN = 'keyboard-hidden',

  // Version
  GET_VERSION = 'get-version',

  // Android specific
  ENABLE_PULL_TO_REFRESH = 'enable-pull-to-refresh',
  DISABLE_PULL_TO_REFRESH = 'disable-pull-to-refresh',
  PREFERS_COLOR_SCHEME = 'prefers-color-scheme',

  // Share
  SHARE_MESSAGE = 'share',

  // Navigation
  ON_FIRST_PAGE = 'nav-on-first-page',
  NOT_ON_FIRST_PAGE = 'nav-not-on-first-page',
  GO_BACK = 'nav-go-back',
  CHANGED_PAGE = 'nav-changed-page',

  // Analytics
  ANALYTICS_IDENTIFY = 'analytics-identify',
  ANALYTICS_TRACK = 'analytics-track',
  ANALYTICS_SCREEN = 'analytics-screen',

  // Logging
  LOGGING = 'logging',

  // Theme
  THEME_CHANGE = 'theme-change'
}

export interface Message {
  type: MessageType
  id: string
  isAction?: boolean
  // Data to pass in message
  [key: string]: any
}
