import { SearchKind } from 'containers/search-page/store/types'
import TimeRange from 'models/TimeRange'
import { StemTrackMetadata } from 'models/Track'
import { ID } from 'models/common/Identifiers'
import AudiusBackend from 'services/AudiusBackend'
import {
  getEagerDiscprov,
  waitForLibsInit
} from 'services/audius-backend/eagerLoadUtils'
import { decodeHashId, encodeHashId } from 'utils/route/hashIds'
import { Nullable, removeNullable } from 'utils/typeUtils'

import { getRemoteVar, IntKeys, StringKeys } from '../remote-config'

import * as adapter from './ResponseAdapter'
import { processSearchResults } from './helper'
import {
  APIActivity,
  APIBlockConfirmation,
  APIPlaylist,
  APIResponse,
  APISearch,
  APISearchAutocomplete,
  APIStem,
  APITrack,
  APIUser,
  OpaqueID
} from './types'

declare global {
  interface Window {
    audiusLibs: any
  }
}

enum PathType {
  RootPath = '',
  VersionPath = '/v1',
  VersionFullPath = '/v1/full'
}

const ROOT_ENDPOINT_MAP = {
  healthCheck: '/health_check',
  blockConfirmation: '/block_confirmation'
}

const FULL_ENDPOINT_MAP = {
  trending: (experiment: string | null) =>
    experiment ? `/tracks/trending/${experiment}` : '/tracks/trending',
  trendingIds: (experiment: string | null) =>
    experiment ? `/tracks/trending/ids/${experiment}` : '/tracks/trending/ids',
  trendingUnderground: (experiment: string | null) =>
    experiment
      ? `/tracks/trending/underground/${experiment}`
      : '/tracks/trending/underground',
  trendingPlaylists: (experiment: string | null) =>
    experiment ? `/playlists/trending/${experiment}` : '/playlists/trending',
  recommended: '/tracks/recommended',
  remixables: '/tracks/remixables',
  following: (userId: OpaqueID) => `/users/${userId}/following`,
  followers: (userId: OpaqueID) => `/users/${userId}/followers`,
  trackRepostUsers: (trackId: OpaqueID) => `/tracks/${trackId}/reposts`,
  trackFavoriteUsers: (trackId: OpaqueID) => `/tracks/${trackId}/favorites`,
  playlistRepostUsers: (playlistId: OpaqueID) =>
    `/playlists/${playlistId}/reposts`,
  playlistFavoriteUsers: (playlistId: OpaqueID) =>
    `/playlists/${playlistId}/favorites`,
  getUser: (userId: OpaqueID) => `/users/${userId}`,
  userByHandle: (handle: OpaqueID) => `/users/handle/${handle}`,
  userTracksByHandle: (handle: OpaqueID) => `/users/handle/${handle}/tracks`,
  userFavoritedTracks: (userId: OpaqueID) =>
    `/users/${userId}/favorites/tracks`,
  userRepostsByHandle: (handle: OpaqueID) => `/users/handle/${handle}/reposts`,
  getPlaylist: (playlistId: OpaqueID) => `/playlists/${playlistId}`,
  topGenreUsers: '/users/genre/top',
  getTrack: (trackId: OpaqueID) => `/tracks/${trackId}`,
  getTrackByHandleAndSlug: `/tracks`,
  getStems: (trackId: OpaqueID) => `/tracks/${trackId}/stems`,
  getRemixes: (trackId: OpaqueID) => `/tracks/${trackId}/remixes`,
  getRemixing: (trackId: OpaqueID) => `/tracks/${trackId}/remixing`,
  searchFull: `/search/full`,
  searchAutocomplete: `/search/autocomplete`
}

const ENDPOINT_MAP = {
  associatedWallets: '/users/associated_wallets',
  associatedWalletUserId: '/users/id',
  userChallenges: (userId: OpaqueID) => `/users/${userId}/challenges`
}

const TRENDING_LIMIT = 100

type QueryParams = {
  [key: string]: string | number | undefined | boolean | string[] | null
}

export type GetTrackArgs = {
  id: ID
  currentUserId?: Nullable<ID>
  unlistedArgs?: {
    urlTitle: string
    handle: string
  }
}

type GetTrackByHandleAndSlugArgs = {
  handle: string
  slug: string
}

type GetTrendingArgs = {
  timeRange?: TimeRange
  offset?: number
  limit?: number
  currentUserId: Nullable<ID>
  genre: Nullable<string>
}

type GetTrendingUndergroundArgs = {
  offset?: number
  limit?: number
  currentUserId: Nullable<ID>
}

type GetTrendingIdsArgs = {
  limit?: number
  genre?: Nullable<string>
}

type GetRecommendedArgs = {
  genre: Nullable<string>
  exclusionList: number[]
  currentUserId: Nullable<ID>
}

type GetRemixablesArgs = {
  limit?: number
  currentUserId: Nullable<ID>
}

type GetFollowingArgs = {
  profileUserId: ID
  currentUserId: Nullable<ID>
  offset?: number
  limit?: number
}

type GetFollowersArgs = {
  profileUserId: ID
  currentUserId: Nullable<ID>
  offset?: number
  limit?: number
}

type GetTrackRepostUsersArgs = {
  trackId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetTrackFavoriteUsersArgs = {
  trackId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetPlaylistRepostUsersArgs = {
  playlistId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetPlaylistFavoriteUsersArgs = {
  playlistId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetUserArgs = {
  userId: ID
  currentUserId: Nullable<ID>
}

type GetUserByHandleArgs = {
  handle: string
  currentUserId: Nullable<ID>
}

type GetUserTracksByHandleArgs = {
  handle: string
  currentUserId: Nullable<ID>
  sort?: 'date' | 'plays'
  offset?: number
  limit?: number
}

type GetProfileListArgs = {
  profileUserId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetTopArtistGenresArgs = {
  genres?: string[]
  limit?: number
  offset?: number
}

type GetUserRepostsByHandleArgs = {
  handle: string
  currentUserId: Nullable<ID>
  offset?: number
  limit?: number
}

type GetPlaylistArgs = {
  playlistId: ID
  currentUserId: Nullable<ID>
}

type GetStemsArgs = {
  trackId: ID
}

type GetRemixesArgs = {
  trackId: ID
  currentUserId: Nullable<ID>
  limit: number
  offset: number
}

type RemixesResponse = {
  tracks: APITrack[]
  count: number
}

type GetRemixingArgs = {
  trackId: ID
  currentUserId: Nullable<ID>
  limit: number
  offset: number
}

type GetSearchArgs = {
  currentUserId: ID
  query: string
  kind: SearchKind
  limit?: number
  offset?: number
}

type TrendingIdsResponse = {
  week: { id: string }[]
  month: { id: string }[]
  year: { id: string }[]
}

type TrendingIds = {
  week: ID[]
  month: ID[]
  year: ID[]
}

type GetTrendingPlaylistsArgs = {
  currentUserId: Nullable<ID>
  limit: number
  offset: number
  time: 'week' | 'month' | 'year'
}

type TrendingPlaylistsResponse = APIPlaylist[]

type GetAssociatedWalletsArgs = {
  userID: number
}

export type AssociatedWalletsResponse = {
  wallets: string[]
  sol_wallets: string[]
}

type GetAssociatedWalletUserIDArgs = {
  address: string
}

type AssociatedWalletUserIdResponse = {
  user_id: Nullable<ID>
}

type GetUserChallengesArgs = {
  userID: number
}

type UserChallengesResponse = {}

type InitializationState =
  | { state: 'uninitialized' }
  | {
      state: 'initialized'
      endpoint: string
      // Requests are dispatched via APIClient rather than libs
      type: 'manual'
    }
  | {
      state: 'initialized'
      endpoint: string
      // Requests are dispatched and handled via libs
      type: 'libs'
    }

const emptySearchResponse: APIResponse<APISearch> = {
  data: {
    users: [],
    followed_users: [],
    tracks: [],
    saved_tracks: [],
    playlists: [],
    saved_playlists: [],
    saved_albums: [],
    albums: []
  }
}

class AudiusAPIClient {
  initializationState: InitializationState = {
    state: 'uninitialized'
  }

  overrideEndpoint?: string

  constructor({ overrideEndpoint }: { overrideEndpoint?: string } = {}) {
    this.overrideEndpoint = overrideEndpoint
  }

  async getTrending({
    timeRange = TimeRange.WEEK,
    limit = TRENDING_LIMIT,
    offset = 0,
    currentUserId,
    genre
  }: GetTrendingArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      time: timeRange,
      limit,
      offset,
      user_id: encodedCurrentUserId || undefined,
      genre: genre || undefined
    }
    const experiment = getRemoteVar(StringKeys.TRENDING_EXPERIMENT)
    const trendingResponse: Nullable<APIResponse<
      APITrack[]
    >> = await this._getResponse(FULL_ENDPOINT_MAP.trending(experiment), params)

    if (!trendingResponse) return []

    const adapted = trendingResponse.data
      .map(adapter.makeTrack)
      .filter(removeNullable)
    return adapted
  }

  async getTrendingUnderground({
    limit = TRENDING_LIMIT,
    offset = 0,
    currentUserId
  }: GetTrendingUndergroundArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      limit,
      offset,
      user_id: encodedCurrentUserId
    }
    const experiment = getRemoteVar(StringKeys.UNDERGROUND_TRENDING_EXPERIMENT)
    const trendingResponse: Nullable<APIResponse<
      APITrack[]
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.trendingUnderground(experiment),
      params
    )

    if (!trendingResponse) return []

    const adapted = trendingResponse.data
      .map(adapter.makeTrack)
      .filter(removeNullable)
    return adapted
  }

  async getTrendingIds({ genre, limit }: GetTrendingIdsArgs) {
    this._assertInitialized()
    const params = {
      limit,
      genre: genre || undefined
    }
    const experiment = getRemoteVar(StringKeys.TRENDING_EXPERIMENT)
    const trendingIdsResponse: Nullable<APIResponse<
      TrendingIdsResponse
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.trendingIds(experiment),
      params
    )
    if (!trendingIdsResponse) {
      return {
        week: [],
        month: [],
        year: []
      }
    }

    const timeRanges = Object.keys(trendingIdsResponse.data) as TimeRange[]
    const res = timeRanges.reduce(
      (acc: TrendingIds, timeRange: TimeRange) => {
        acc[timeRange] = trendingIdsResponse.data[timeRange]
          .map(adapter.makeTrackId)
          .filter(Boolean) as ID[]
        return acc
      },
      {
        week: [],
        month: [],
        year: []
      }
    )
    return res
  }

  async getRecommended({
    genre,
    exclusionList,
    currentUserId
  }: GetRecommendedArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      genre,
      limit: getRemoteVar(IntKeys.AUTOPLAY_LIMIT) || 10,
      exclusion_list:
        exclusionList.length > 0 ? exclusionList.map(String) : undefined,
      user_id: encodedCurrentUserId || undefined
    }
    const recommendedResponse: Nullable<APIResponse<
      APITrack[]
    >> = await this._getResponse(FULL_ENDPOINT_MAP.recommended, params)

    if (!recommendedResponse) return []

    const adapted = recommendedResponse.data
      .map(adapter.makeTrack)
      .filter(removeNullable)
    return adapted
  }

  async getRemixables({ limit = 25, currentUserId }: GetRemixablesArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      limit,
      user_id: encodedCurrentUserId || undefined
      // with_users: true
    }
    const remixablesResponse: Nullable<APIResponse<
      APITrack[]
    >> = await this._getResponse(FULL_ENDPOINT_MAP.remixables, params)

    if (!remixablesResponse) return []

    const adapted = remixablesResponse.data
      .map(adapter.makeUserlessTrack)
      .filter(removeNullable)

    return adapted
  }

  async getFollowing({
    currentUserId,
    profileUserId,
    limit,
    offset
  }: GetFollowingArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedProfileUserId = this._encodeOrThrow(profileUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const followingResponse: Nullable<APIResponse<
      APIUser[]
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.following(encodedProfileUserId),
      params
    )
    if (!followingResponse) return []
    const adapted = followingResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getFollowers({
    currentUserId,
    profileUserId,
    limit,
    offset
  }: GetFollowersArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedProfileUserId = this._encodeOrThrow(profileUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const followersResponse: Nullable<APIResponse<
      APIUser[]
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.followers(encodedProfileUserId),
      params
    )

    if (!followersResponse) return []

    const adapted = followersResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getTrackRepostUsers({
    currentUserId,
    trackId,
    limit,
    offset
  }: GetTrackRepostUsersArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedTrackId = this._encodeOrThrow(trackId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const repostUsers: Nullable<APIResponse<
      APIUser[]
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.trackRepostUsers(encodedTrackId),
      params
    )

    if (!repostUsers) return []

    const adapted = repostUsers.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getTrackFavoriteUsers({
    currentUserId,
    trackId,
    limit,
    offset
  }: GetTrackFavoriteUsersArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedTrackId = this._encodeOrThrow(trackId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const followingResponse: Nullable<APIResponse<
      APIUser[]
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.trackFavoriteUsers(encodedTrackId),
      params
    )

    if (!followingResponse) return []

    const adapted = followingResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getPlaylistRepostUsers({
    currentUserId,
    playlistId,
    limit,
    offset
  }: GetPlaylistRepostUsersArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedPlaylistId = this._encodeOrThrow(playlistId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const repostUsers: Nullable<APIResponse<
      APIUser[]
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.playlistRepostUsers(encodedPlaylistId),
      params
    )

    if (!repostUsers) return []

    const adapted = repostUsers.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getPlaylistFavoriteUsers({
    currentUserId,
    playlistId,
    limit,
    offset
  }: GetPlaylistFavoriteUsersArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedPlaylistId = this._encodeOrThrow(playlistId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const followingResponse: Nullable<APIResponse<
      APIUser[]
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.playlistFavoriteUsers(encodedPlaylistId),
      params
    )

    if (!followingResponse) return []

    const adapted = followingResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getTrack(
    { id, currentUserId, unlistedArgs }: GetTrackArgs,
    retry = true
  ) {
    const encodedTrackId = this._encodeOrThrow(id)
    const encodedCurrentUserId = encodeHashId(currentUserId)

    this._assertInitialized()

    const args = {
      user_id: encodedCurrentUserId,
      url_title: unlistedArgs?.urlTitle,
      handle: unlistedArgs?.handle,
      show_unlisted: !!unlistedArgs
    }

    const trackResponse: Nullable<APIResponse<
      APITrack
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.getTrack(encodedTrackId),
      args,
      retry
    )

    if (!trackResponse) return null
    const adapted = adapter.makeTrack(trackResponse.data)
    return adapted
  }

  async getTrackByHandleAndSlug(args: GetTrackByHandleAndSlugArgs) {
    this._assertInitialized()

    const trackResponse: Nullable<APIResponse<
      APITrack
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.getTrackByHandleAndSlug,
      args,
      true
    )
    if (!trackResponse) return null
    return adapter.makeTrack(trackResponse.data)
  }

  async getStems({ trackId }: GetStemsArgs): Promise<StemTrackMetadata[]> {
    this._assertInitialized()
    const encodedTrackId = this._encodeOrThrow(trackId)
    const response: Nullable<APIResponse<APIStem[]>> = await this._getResponse(
      FULL_ENDPOINT_MAP.getStems(encodedTrackId)
    )

    if (!response) return []

    const adapted = response.data
      .map(adapter.makeStemTrack)
      .filter(removeNullable)
    return adapted
  }

  async getRemixes({ trackId, limit, offset, currentUserId }: GetRemixesArgs) {
    this._assertInitialized()
    const encodedTrackId = this._encodeOrThrow(trackId)
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      userId: encodedUserId ?? undefined,
      limit,
      offset
    }

    const remixesResponse: Nullable<APIResponse<
      RemixesResponse
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.getRemixes(encodedTrackId),
      params
    )

    if (!remixesResponse) return []

    const tracks = remixesResponse.data.tracks.map(adapter.makeTrack)
    return { count: remixesResponse.data.count, tracks }
  }

  async getRemixing({
    trackId,
    limit,
    offset,
    currentUserId
  }: GetRemixingArgs) {
    this._assertInitialized()
    const encodedTrackId = this._encodeOrThrow(trackId)
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      userId: encodedUserId ?? undefined,
      limit,
      offset
    }

    const remixingResponse: Nullable<APIResponse<
      APITrack[]
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.getRemixing(encodedTrackId),
      params
    )

    if (!remixingResponse) return []

    const tracks = remixingResponse.data.map(adapter.makeTrack)
    return tracks
  }

  async getUser({ userId, currentUserId }: GetUserArgs) {
    const encodedUserId = this._encodeOrThrow(userId)
    const encodedCurrentUserId = encodeHashId(currentUserId)
    this._assertInitialized()
    const params = {
      user_id: encodedCurrentUserId || undefined
    }

    const response: Nullable<APIResponse<APIUser[]>> = await this._getResponse(
      FULL_ENDPOINT_MAP.getUser(encodedUserId),
      params
    )

    if (!response) return []

    const adapted = response.data.map(adapter.makeUser).filter(removeNullable)
    return adapted
  }

  async getUserByHandle({ handle, currentUserId }: GetUserByHandleArgs) {
    const encodedCurrentUserId = encodeHashId(currentUserId)
    this._assertInitialized()
    const params = {
      user_id: encodedCurrentUserId || undefined
    }

    const response: Nullable<APIResponse<APIUser[]>> = await this._getResponse(
      FULL_ENDPOINT_MAP.userByHandle(handle),
      params
    )

    if (!response) return []

    const adapted = response.data.map(adapter.makeUser).filter(removeNullable)
    return adapted
  }

  async getUserTracksByHandle({
    handle,
    currentUserId,
    sort = 'date',
    limit,
    offset
  }: GetUserTracksByHandleArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      sort,
      limit,
      offset
    }

    const response: Nullable<APIResponse<APITrack[]>> = await this._getResponse(
      FULL_ENDPOINT_MAP.userTracksByHandle(handle),
      params
    )

    if (!response) return []

    const adapted = response.data.map(adapter.makeTrack).filter(removeNullable)
    return adapted
  }

  async getFavoritedTracks({
    profileUserId,
    currentUserId,
    limit,
    offset
  }: GetProfileListArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)
    const encodedProfileUserId = this._encodeOrThrow(profileUserId)
    const params = {
      user_id: encodedUserId || undefined,
      limit,
      offset
    }

    const response: Nullable<APIResponse<
      APIActivity[]
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.userFavoritedTracks(encodedProfileUserId),
      params
    )

    if (!response) return []

    const adapted = response.data.map(({ item, ...props }) => ({
      timestamp: props.timestamp,
      track: adapter.makeTrack(item as APITrack)
    }))
    return adapted
  }

  async getUserRepostsByHandle({
    handle,
    currentUserId,
    limit,
    offset
  }: GetUserRepostsByHandleArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const response: Nullable<APIResponse<
      APIActivity[]
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.userRepostsByHandle(handle),
      params
    )

    if (!response) return []

    const adapted = response.data
      .map(adapter.makeActivity)
      .filter(removeNullable)
    return adapted
  }

  async getTopArtistGenres({ genres, limit, offset }: GetTopArtistGenresArgs) {
    this._assertInitialized()

    const params = {
      genre: genres,
      limit,
      offset
    }

    const favoritedTrackResponse: Nullable<APIResponse<
      APIUser[]
    >> = await this._getResponse(FULL_ENDPOINT_MAP.topGenreUsers, params)

    if (!favoritedTrackResponse) return []

    const adapted = favoritedTrackResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getPlaylist({ playlistId, currentUserId }: GetPlaylistArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedPlaylistId = this._encodeOrThrow(playlistId)
    const params = {
      user_id: encodedCurrentUserId || undefined
    }

    const response: Nullable<APIResponse<
      APIPlaylist[]
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.getPlaylist(encodedPlaylistId),
      params
    )

    if (!response) return []

    const adapted = response.data
      .map(adapter.makePlaylist)
      .filter(removeNullable)
    return adapted
  }

  async getSearchFull({
    currentUserId,
    query,
    kind,
    offset,
    limit
  }: GetSearchArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedUserId,
      query,
      kind,
      offset,
      limit
    }

    const searchResponse: Nullable<APIResponse<APISearch>> =
      (await this._getResponse(FULL_ENDPOINT_MAP.searchFull, params)) ??
      emptySearchResponse

    const adapted = adapter.adaptSearchResponse(searchResponse)
    return processSearchResults(adapted)
  }

  async getSearchAutocomplete({
    currentUserId,
    query,
    kind,
    offset,
    limit
  }: GetSearchArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedUserId,
      query,
      kind,
      offset,
      limit
    }

    const searchResponse: Nullable<APIResponse<APISearchAutocomplete>> =
      (await this._getResponse(FULL_ENDPOINT_MAP.searchAutocomplete, params)) ??
      emptySearchResponse
    const adapted = adapter.adaptSearchAutocompleteResponse(searchResponse)
    return processSearchResults({
      isAutocomplete: true,
      ...adapted
    })
  }

  async getTrendingPlaylists({
    currentUserId,
    time,
    limit,
    offset
  }: GetTrendingPlaylistsArgs) {
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedUserId,
      limit,
      offset,
      time
    }

    const experiment = getRemoteVar(StringKeys.PLAYLIST_TRENDING_EXPERIMENT)
    const response: Nullable<APIResponse<
      APIPlaylist[]
    >> = await this._getResponse(
      FULL_ENDPOINT_MAP.trendingPlaylists(experiment),
      params
    )

    if (!response) return []
    const adapted = response.data
      .map(adapter.makePlaylist)
      .filter(removeNullable)
    return adapted
  }

  async getAssociatedWallets({ userID }: GetAssociatedWalletsArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(userID)
    const params = { id: encodedCurrentUserId }
    const associatedWallets: Nullable<APIResponse<
      AssociatedWalletsResponse
    >> = await this._getResponse(
      ENDPOINT_MAP.associatedWallets,
      params,
      true,
      PathType.VersionPath
    )

    if (!associatedWallets) return null
    return associatedWallets.data
  }

  async getAssociatedWalletUserId({ address }: GetAssociatedWalletUserIDArgs) {
    this._assertInitialized()
    const params = { associated_wallet: address }

    const userID: Nullable<APIResponse<
      AssociatedWalletUserIdResponse
    >> = await this._getResponse(
      ENDPOINT_MAP.associatedWalletUserId,
      params,
      true,
      PathType.VersionPath
    )

    if (!userID) return null
    const encodedUserId = userID.data.user_id
    return encodedUserId ? decodeHashId(encodedUserId.toString()) : null
  }

  async getUserChallenges({ userID }: GetUserChallengesArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(userID)
    if (encodedCurrentUserId === null) return null // throw error

    const params = { id: encodedCurrentUserId }

    const userChallenges: Nullable<APIResponse<
      UserChallengesResponse
    >> = await this._getResponse(
      ENDPOINT_MAP.userChallenges(encodedCurrentUserId),
      params,
      true,
      PathType.VersionPath
    )

    if (!userChallenges) return null
    return userChallenges.data
  }

  async getBlockConfirmation(blockhash: string, blocknumber: number) {
    const response: Nullable<APIResponse<
      APIBlockConfirmation
    >> = await this._getResponse(
      ROOT_ENDPOINT_MAP.blockConfirmation,
      { blockhash, blocknumber },
      true,
      PathType.RootPath
    )
    if (!response) return {}
    return response.data
  }

  init() {
    if (this.initializationState.state === 'initialized') return

    // If override passed, use that and return
    if (this.overrideEndpoint) {
      console.debug(
        `APIClient: Using override endpoint: ${this.overrideEndpoint}`
      )
      this.initializationState = {
        state: 'initialized',
        endpoint: this.overrideEndpoint,
        type: 'manual'
      }
      return
    }

    // Set the state to the eager discprov
    const eagerDiscprov = getEagerDiscprov()
    if (eagerDiscprov) {
      console.debug(`APIClient: setting to eager discprov: ${eagerDiscprov}`)
      this.initializationState = {
        state: 'initialized',
        endpoint: eagerDiscprov,
        type: 'manual'
      }
    }

    // Listen for libs on chain selection
    AudiusBackend.addDiscoveryProviderSelectionListener((endpoint: string) => {
      console.debug(`APIClient: Setting to libs discprov: ${endpoint}`)
      this.initializationState = {
        state: 'initialized',
        endpoint,
        type: 'libs'
      }
    })

    console.debug('APIClient: Initialized')
  }

  makeUrl = (
    path: string,
    queryParams: QueryParams = {},
    pathType: PathType = PathType.VersionPath
  ) => {
    const formattedPath = this._formatPath(pathType, path)
    return this._constructUrl(formattedPath, queryParams)
  }

  // Helpers

  _assertInitialized() {
    if (this.initializationState.state !== 'initialized')
      throw new Error('AudiusAPIClient must be initialized before use')
  }

  async _getResponse<T>(
    path: string,
    params: QueryParams = {},
    retry = true,
    pathType: PathType = PathType.VersionFullPath
  ): Promise<Nullable<T>> {
    if (this.initializationState.state !== 'initialized')
      throw new Error('_constructURL called uninitialized')

    // If a param has a null value, remove it
    const sanitizedParams = Object.keys(params).reduce((acc, cur) => {
      const val = params[cur]
      if (val === null || val === undefined) return acc
      return { ...acc, [cur]: val }
    }, {})

    const formattedPath = this._formatPath(pathType, path)
    if (this.initializationState.type === 'libs' && window.audiusLibs) {
      const data = await window.audiusLibs.discoveryProvider._makeRequest(
        {
          endpoint: formattedPath,
          queryParams: sanitizedParams
        },
        retry
      )
      if (!data) return null
      // TODO: Type boundaries of API
      return { data } as any
    }

    // Initialization type is manual. Make requests with fetch and handle failures.
    const resource = this._constructUrl(formattedPath, sanitizedParams)
    try {
      const response = await fetch(resource)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(response.statusText)
      }
      return response.json()
    } catch (e) {
      // Something went wrong with the request and we should wait for the libs
      // initialization state if needed before retrying
      if (this.initializationState.type === 'manual') {
        await waitForLibsInit()
      }
      return this._getResponse(path, sanitizedParams, retry, pathType)
    }
  }

  _formatPath(pathType: PathType, path: string) {
    return `${pathType}${path}`
  }

  _encodeOrThrow(id: ID): OpaqueID {
    const encoded = encodeHashId(id)
    if (!encoded) {
      throw new Error(`Unable to encode id: ${id}`)
    }
    return encoded
  }

  _constructUrl(path: string, queryParams: QueryParams = {}) {
    if (this.initializationState.state !== 'initialized')
      throw new Error('_constructURL called uninitialized')
    const params = Object.entries(queryParams)
      .filter(p => p[1] !== undefined && p[1] !== null)
      .map(p => {
        if (Array.isArray(p[1])) {
          return p[1].map(val => `${p[0]}=${encodeURIComponent(val)}`).join('&')
        }
        return `${p[0]}=${encodeURIComponent(p[1]!)}`
      })
      .join('&')
    return `${this.initializationState.endpoint}${path}?${params}`
  }
}

const instance = new AudiusAPIClient()

export default instance
