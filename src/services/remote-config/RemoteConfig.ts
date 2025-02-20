export enum IntKeys {
  /**
   * Duration (in ms) before we consider the fetch of an image against
   * a primary creator node a failure and try using libs.fetchCID
   */
  IMAGE_QUICK_FETCH_TIMEOUT_MS = 'IMAGE_QUICK_FETCH_TIMEOUT_MS',
  /**
   * The size at which a bundle of image loading performance metrics
   * are sent to the analytics sever
   */
  IMAGE_QUICK_FETCH_PERFORMANCE_BATCH_SIZE = 'IMAGE_QUICK_FETCH_PERFORMANCE_BATCH_SIZE',

  /**
   * Duration (in ms) before we timeout a discovery provider that is
   * cached in the user's local storage
   */
  DISCOVERY_PROVIDER_SELECTION_TIMEOUT_MS = 'DISCOVERY_PROVIDER_SELECTION_TIMEOUT_MS',

  /**
   * Frequency (in ms) to poll for user wallet balance on the client dashboard page
   */
  DASHBOARD_WALLET_BALANCE_POLLING_FREQ_MS = 'DASHBOARD_WALLET_BALANCE_POLLING_FREQ_MS',

  /**
   * Frequency (in ms) to poll for notifications from identity service.
   */
  NOTIFICATION_POLLING_FREQ_MS = 'NOTIFICATION_POLLING_FREQ_MS',

  /**
   * Service monitoring health check analytics sample rate (int out of 100). A value of 50
   * means that half of health checks are recorded.
   */
  SERVICE_MONITOR_HEALTH_CHECK_SAMPLE_RATE = 'SERVICE_MONITOR_HEALTH_CHECK_SAMPLE_RATE',

  /**
   * Service monitoring request analytics sample rate (int out of 100). A value of 50
   * means that half of all requests are recorded.
   */
  SERVICE_MONITOR_REQUEST_SAMPLE_RATE = 'SERVICE_MONITOR_REQUEST_SAMPLE_RATE',

  /**
   * Instagram handle taken check timeout
   */
  INSTAGRAM_HANDLE_CHECK_TIMEOUT = 'INSTAGRAM_HANDLE_CHECK_TIMEOUT',

  /**
   * Number of random (recommended) tracks to fetch and add to the autoplay queue
   */
  AUTOPLAY_LIMIT = 'AUTOPLAY_LIMIT',

  /**
   * Request timeout in ms before a selected discovery node is thought of as unhealthy
   */
  DISCOVERY_NODE_SELECTION_REQUEST_TIMEOUT = 'DISCOVERY_NODE_SELECTION_REQUEST_TIMEOUT',

  /**
   * Number of retries to a discovery node before it is thought of as unhealthy
   */
  DISCOVERY_NODE_SELECTION_REQUEST_RETRIES = 'DISCOVERY_NODE_SELECTION_REQUEST_RETRIES'
}

export enum BooleanKeys {
  /*
   * Boolean to show wallet connect as an option for associating wallets
   */
  DISPLAY_WEB3_PROVIDER_WALLET_CONNECT = 'DISPLAY_WEB3_PROVIDER_WALLET_CONNECT',
  /*
   * Boolean to show bitski as an option for associating wallets
   */
  DISPLAY_WEB3_PROVIDER_BITSKI = 'DISPLAY_WEB3_PROVIDER_BITSKI',
  /*
   * Boolean to show wallet link as an option for associating wallets
   */
  DISPLAY_WEB3_PROVIDER_WALLET_LINK = 'DISPLAY_WEB3_PROVIDER_WALLET_LINK',
  /*
   * Boolean to show phantom as an option for associating spl wallets
   */
  DISPLAY_SOLANA_WEB3_PROVIDER_PHANTOM = 'DISPLAY_SOLANA_WEB3_PROVIDER_PHANTOM',
  /*
   * Boolean to show sollet as an option for associating spl wallets
   */
  DISPLAY_SOLANA_WEB3_PROVIDER_SOLLET = 'DISPLAY_SOLANA_WEB3_PROVIDER_SOLLET',
  /*
   * Boolean to show instagram verification on mobile.
   */
  DISPLAY_INSTAGRAM_VERIFICATION = 'DISPLAY_INSTAGRAM_VERIFICATION',
  /*
   * Boolean to show instagram verification on web + desktop.
   */
  DISPLAY_INSTAGRAM_VERIFICATION_WEB_AND_DESKTOP = 'DISPLAY_INSTAGRAM_VERIFICATION_WEB_AND_DESKTOP',

  /**
   * Boolean to skip the rollover nodes sanity check.
   */
  SKIP_ROLLOVER_NODES_SANITY_CHECK = 'SKIP_ROLLOVER_NODES_SANITY_CHECK'
}

export enum DoubleKeys {}

export enum StringKeys {
  /**
   * Logo variant to display in the top left of the app.
   * `AUDIUS_LOGO_VARIANT_CLICK_TARGET` can be used to customize the
   * url that is navigated to on click.
   */
  AUDIUS_LOGO_VARIANT = 'AUDIUS_LOGO_VARIANT',

  /**
   * Click target for the top left Audius logo in the app.
   */
  AUDIUS_LOGO_VARIANT_CLICK_TARGET = 'AUDIUS_LOGO_VARIANT_CLICK_TARGET',

  /**
   * Custom text for a top of page notice.
   */
  APP_WIDE_NOTICE_TEXT = 'APP_WIDE_NOTICE_TEXT',

  /**
   * Custom eth provider urls to use for talking to main-net contracts
   */
  ETH_PROVIDER_URLS = 'ETH_PROVIDER_URLS',

  /**
   * Blocks content
   */
  CONTENT_BLOCK_LIST = 'CONTENT_BLOCK_LIST',

  /**
   * Blocks content nodes from selection
   */
  CONTENT_NODE_BLOCK_LIST = 'CONTENT_NODE_BLOCK_LIST',

  /**
   * Blocks discovery nodes from selection
   */
  DISCOVERY_NODE_BLOCK_LIST = 'DISCOVERY_NODE_BLOCK_LIST',

  /**
   * Instagram Profile API url. Must contain $USERNAME$
   */
  INSTAGRAM_API_PROFILE_URL = 'INSTAGRAM_API_PROFILE_URL',

  /**
   * User ids omitted from trending playlists (used to omit Audius from rewards).
   * Comma-separated.
   */
  TRENDING_PLAYLIST_OMITTED_USER_IDS = 'TRENDING_PLAYLIST_OMITTED_USER_IDS',

  /** Rewards IDs as comma-separated array */
  REWARDS_IDS = 'REWARDS_IDS',
  TRENDING_REWARD_IDS = 'TRENDING_REWARD_IDS',
  CHALLENGE_REWARD_IDS = 'CHALLENGE_REWARD_IDS',

  /** Embedded tweet for trending rewards UI tracks */
  REWARDS_TWEET_ID_TRACKS = 'REWARDS_TWEET_ID_TRACKS',

  /** Embedded tweet for trending rewards UI playlists */
  REWARDS_TWEET_ID_PLAYLISTS = 'REWARDS_TWEET_ID_PLAYLISTS',

  /** Embedded tweet for underground trending rewards UI  */
  REWARDS_TWEET_ID_UNDERGROUND = 'REWARDS_TWEET_ID_UNDERGROUND',

  /** Audio that should be streamed via mp3 rather than HLS. Comma separated hash ids. */
  FORCE_MP3_STREAM_TRACK_IDS = 'FORCE_MP3_STREAM_TRACK_IDS',

  /** TF */
  TF = 'TF',
  TPF = 'TPF',
  UTF = 'UTF',

  /** Trending experiment id */
  TRENDING_EXPERIMENT = 'TRENDING_EXPERIMENT',

  /** Underground trending experiment id */
  UNDERGROUND_TRENDING_EXPERIMENT = 'UNDERGROUND_TRENDING_EXPERIMENT',

  /** Playlist trending experiment id */
  PLAYLIST_TRENDING_EXPERIMENT = 'PLAYLIST_TRENDING_EXPERIMENT'
}

export type AllRemoteConfigKeys =
  | IntKeys
  | BooleanKeys
  | DoubleKeys
  | StringKeys
