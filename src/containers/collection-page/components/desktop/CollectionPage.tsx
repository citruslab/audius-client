import React, { useEffect } from 'react'

import CollectionHeader from 'components/collection/desktop/CollectionHeader'
import Page from 'components/general/Page'
import TracksTable from 'components/tracks-table/TracksTable'
import {
  CollectionTrack,
  TrackRecord,
  CollectionsPageType
} from 'containers/collection-page/store/types'
import { computeCollectionMetadataProps } from 'containers/collection-page/store/utils'
import Collection, { SmartCollection, Variant } from 'models/Collection'
import User from 'models/User'
import { ID } from 'models/common/Identifiers'
import { Status } from 'store/types'

import styles from './CollectionPage.module.css'

const messages = {
  emptyPage: {
    owner:
      'Find a track you want to add and click the ••• button to add it to your playlist',
    visitor: 'This Playlist is Empty...'
  },
  type: {
    playlist: 'Playlist',
    album: 'Album'
  },
  remove: 'Remove from this'
}

const EmptyPage = (props: { text?: string; isOwner: boolean }) => {
  const text =
    props.text ||
    (props.isOwner ? messages.emptyPage.owner : messages.emptyPage.visitor)
  return (
    <div className={styles.emptyWrapper}>
      <div>{text}</div>
    </div>
  )
}

export type CollectionPageProps = {
  title: string
  description: string
  canonicalUrl: string
  playlistId: ID
  playing: boolean
  getPlayingUid: () => string | null
  type: CollectionsPageType
  collection: {
    status: string
    metadata: Collection | SmartCollection | null
    user: User | null
  }
  tracks: {
    status: string
    entries: CollectionTrack[]
  }
  userId: ID | null
  userPlaylists: any
  isQueued: () => boolean
  onHeroTrackClickArtistName: () => void
  onPlay: (record: TrackRecord) => void
  onHeroTrackShare: (record: TrackRecord) => void
  onHeroTrackSave: (record: TrackRecord) => void
  onClickRow: (record: TrackRecord) => void
  onClickSave: (record: TrackRecord) => void
  allowReordering: boolean
  getFilteredData: (trackMetadata: CollectionTrack[]) => [TrackRecord[], number]
  onFilterChange: (evt: React.ChangeEvent<HTMLInputElement>) => void
  onHeroTrackEdit: () => void
  onPublish: () => void
  onHeroTrackRepost: any
  onClickTrackName: (record: TrackRecord) => void
  onClickArtistName: (record: TrackRecord) => void
  onClickRepostTrack: (record: TrackRecord) => void
  onSortTracks: (sorters: any) => void
  onReorderTracks: (source: number, destination: number) => void
  onClickRemove: (
    trackId: number,
    index: number,
    uid: string,
    timestamp: number
  ) => void
  onFollow: () => void
  onUnfollow: () => void
  onClickReposts: () => void
  onClickFavorites: () => void
  onClickDescriptionExternalLink: (e: any) => void
}

const CollectionPage = ({
  title,
  description: pageDescription,
  canonicalUrl,
  playlistId,
  allowReordering,
  playing,
  type,
  collection: { status, metadata, user },
  tracks,
  userId,
  userPlaylists,
  getFilteredData,
  isQueued,
  onHeroTrackClickArtistName,
  onFilterChange,
  onPlay,
  onHeroTrackEdit,
  onPublish,
  onHeroTrackShare,
  onHeroTrackSave,
  onHeroTrackRepost,
  onClickRow,
  onClickSave,
  onClickTrackName,
  onClickArtistName,
  onClickRepostTrack,
  onSortTracks,
  onReorderTracks,
  onClickRemove,
  onFollow,
  onUnfollow,
  onClickReposts,
  onClickFavorites,
  onClickDescriptionExternalLink
}: CollectionPageProps) => {
  // TODO: Consider dynamic lineups, esp. for caching improvement.
  const [dataSource, playingIndex] =
    tracks.status === Status.SUCCESS
      ? getFilteredData(tracks.entries)
      : [[], -1]
  const collectionLoading = status === Status.LOADING
  const queuedAndPlaying = playing && isQueued()
  const tracksLoading = tracks.status === Status.LOADING

  const coverArtSizes =
    metadata && metadata?.variant !== Variant.SMART
      ? metadata._cover_art_sizes
      : null
  const duration =
    tracks.entries?.reduce(
      (duration: number, entry: CollectionTrack) => duration + entry.duration,
      0
    ) ?? 0

  const playlistOwnerName = user?.name ?? ''
  const playlistOwnerHandle = user?.handle ?? ''
  const playlistOwnerId = user?.user_id ?? null
  const isOwner = userId === playlistOwnerId
  const isFollowing = user?.does_current_user_follow ?? false
  const isSaved =
    metadata?.has_current_user_saved || playlistId in userPlaylists

  const variant = metadata?.variant ?? null
  const gradient =
    (metadata?.variant === Variant.SMART && metadata.gradient) ?? ''
  const icon = (metadata?.variant === Variant.SMART && metadata.icon) ?? null

  const {
    trackCount,
    isEmpty,
    lastModified,
    playlistName,
    description,
    isPrivate,
    isAlbum,
    isPublishing,
    playlistSaveCount,
    playlistRepostCount,
    isReposted
  } = computeCollectionMetadataProps(metadata)

  const topSection = (
    <CollectionHeader
      collectionId={playlistId}
      userId={playlistOwnerId}
      loading={collectionLoading}
      tracksLoading={tracksLoading}
      type={type}
      title={playlistName}
      artistName={playlistOwnerName}
      artistHandle={playlistOwnerHandle}
      coverArtSizes={coverArtSizes}
      description={description}
      isOwner={isOwner}
      isAlbum={isAlbum}
      numTracks={dataSource.length}
      modified={lastModified}
      duration={duration}
      isPublished={!isPrivate}
      isPublishing={isPublishing}
      isReposted={isReposted}
      isSaved={isSaved}
      isFollowing={isFollowing}
      reposts={playlistRepostCount}
      saves={playlistSaveCount}
      playing={queuedAndPlaying}
      // Actions
      onClickArtistName={onHeroTrackClickArtistName}
      onFilterChange={onFilterChange}
      onPlay={onPlay}
      onEdit={onHeroTrackEdit}
      onPublish={onPublish}
      onShare={onHeroTrackShare}
      onSave={onHeroTrackSave}
      onRepost={onHeroTrackRepost}
      onFollow={onFollow}
      onUnfollow={onUnfollow}
      onClickReposts={onClickReposts}
      onClickFavorites={onClickFavorites}
      onClickDescriptionExternalLink={onClickDescriptionExternalLink}
      // Smart collection
      variant={variant}
      gradient={gradient}
      icon={icon}
    />
  )

  return (
    <Page
      title={title}
      description={pageDescription}
      canonicalUrl={canonicalUrl}
      containerClassName={styles.pageContainer}
      scrollableSearch
    >
      <div className={styles.bodyWrapper}>
        <div className={styles.topSectionWrapper}>{topSection}</div>
        {!collectionLoading && isEmpty ? (
          <EmptyPage isOwner={isOwner} />
        ) : (
          <div className={styles.tableWrapper}>
            {collectionLoading ? null : (
              <TracksTable
                key={playlistName}
                loading={tracksLoading}
                loadingRowsCount={trackCount}
                userId={userId}
                playing={playing}
                playingIndex={playingIndex}
                dataSource={dataSource}
                allowReordering={
                  userId !== null &&
                  userId === playlistOwnerId &&
                  allowReordering &&
                  !isAlbum
                }
                onClickRow={onClickRow}
                onClickFavorite={onClickSave}
                onClickTrackName={onClickTrackName}
                onClickArtistName={onClickArtistName}
                onClickRepost={onClickRepostTrack}
                onSortTracks={onSortTracks}
                onReorderTracks={onReorderTracks}
                onClickRemove={isOwner ? onClickRemove : null}
                removeText={`${messages.remove} ${
                  isAlbum ? messages.type.album : messages.type.playlist
                }`}
              />
            )}
          </div>
        )}
      </div>
    </Page>
  )
}

export default CollectionPage
