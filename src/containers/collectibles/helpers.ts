import {
  Collectible,
  CollectibleType
} from 'containers/collectibles/components/types'
import { OpenSeaAsset, OpenSeaEvent } from 'services/opensea-client/types'
import {
  SolanaNFT,
  SolanaNFTPropertiesFile
} from 'services/solana-client/types'
import { gifPreview } from 'utils/imageProcessingUtil'
import { Nullable } from 'utils/typeUtils'

/**
 * extensions based on OpenSea metadata standards
 * https://docs.opensea.io/docs/metadata-standards
 */
const OPENSEA_AUDIO_EXTENSIONS = ['mp3', 'wav', 'oga']
const OPENSEA_VIDEO_EXTENSIONS = [
  'gltf',
  'glb',
  'webm',
  'mp4',
  'm4v',
  'ogv',
  'ogg',
  'mov'
]

const SUPPORTED_VIDEO_EXTENSIONS = ['webm', 'mp4', 'ogv', 'ogg', 'mov']

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

const isAssetImage = (asset: OpenSeaAsset) => {
  const nonImageExtensions = [
    ...OPENSEA_VIDEO_EXTENSIONS,
    ...OPENSEA_AUDIO_EXTENSIONS
  ]
  return [
    asset.image_url,
    asset.image_original_url,
    asset.image_preview_url,
    asset.image_thumbnail_url
  ].some(url => url && nonImageExtensions.every(ext => !url.endsWith(ext)))
}

const isAssetVideo = (asset: OpenSeaAsset) => {
  const {
    animation_url,
    animation_original_url,
    image_url,
    image_original_url,
    image_preview_url,
    image_thumbnail_url
  } = asset
  return [
    animation_url || '',
    animation_original_url || '',
    image_url,
    image_original_url,
    image_preview_url,
    image_thumbnail_url
  ].some(
    url => url && SUPPORTED_VIDEO_EXTENSIONS.some(ext => url.endsWith(ext))
  )
}

const isAssetGif = (asset: OpenSeaAsset) => {
  return !!(
    asset.image_url?.endsWith('.gif') ||
    asset.image_original_url?.endsWith('.gif') ||
    asset.image_preview_url?.endsWith('.gif') ||
    asset.image_thumbnail_url?.endsWith('.gif')
  )
}

export const isAssetValid = (asset: OpenSeaAsset) => {
  return isAssetVideo(asset) || isAssetImage(asset) || isAssetGif(asset)
}

/**
 * Returns a collectible given an asset object from the OpenSea API
 *
 * A lot of the work here is to determine whether a collectible is a gif, a video, or an image
 *
 * If the collectible is a gif, we set the gifUrl, and we process a frame from the gifUrl which we set as its frameUrl
 *
 * If the collectible is a video, we set the videoUrl, and we check whether the asset has an image
 * - if it has an image, we check whether the image url is an actual image or a video (sometimes OpenSea returns
 *   videos in the image url properties of the asset)
 *   - if it's an image, we set it as the frameUrl
 *   - otherwise, we unset the frameUrl
 * - if not, we do not set the frameUrl
 * Video collectibles that do not have a frameUrl will use the video paused at the first frame as the thumbnail
 * in the collectibles tab
 *
 * Otherwise, we consider the collectible to be an image, we get the image url and make sure that it is not
 * a gif or a video
 * - if it's a gif, we follow the above gif logic
 * - if it's a video, we unset the frameUrl and follow the above video logic
 * - otherwise, we set the frameUrl and the imageUrl
 *
 * @param asset
 */
export const assetToCollectible = async (
  asset: OpenSeaAsset
): Promise<Collectible> => {
  let type: CollectibleType
  let frameUrl = null
  let imageUrl = null
  let videoUrl = null
  let gifUrl = null

  const { animation_url, animation_original_url, name } = asset
  const imageUrls = [
    asset.image_url,
    asset.image_original_url,
    asset.image_preview_url,
    asset.image_thumbnail_url
  ]

  try {
    if (isAssetGif(asset)) {
      type = CollectibleType.GIF
      const urlForFrame = imageUrls.find(url => url?.endsWith('.gif'))!
      frameUrl = await getFrameFromGif(urlForFrame, name || '')
      gifUrl = imageUrls.find(url => url?.endsWith('.gif'))!
    } else if (isAssetVideo(asset)) {
      type = CollectibleType.VIDEO
      frameUrl =
        imageUrls.find(
          url =>
            url && SUPPORTED_VIDEO_EXTENSIONS.every(ext => !url.endsWith(ext))
        ) ?? null

      /**
       * make sure frame url is not a video
       * if it is a video, unset frame url so that component will use a video url instead
       */
      if (frameUrl) {
        const res = await fetch(frameUrl, { method: 'HEAD' })
        const isVideo = res.headers.get('Content-Type')?.includes('video')
        if (isVideo) {
          frameUrl = null
        }
      }

      videoUrl = [animation_url, animation_original_url, ...imageUrls].find(
        url => url && SUPPORTED_VIDEO_EXTENSIONS.some(ext => url.endsWith(ext))
      )!
    } else {
      type = CollectibleType.IMAGE
      frameUrl = imageUrls.find(url => !!url)!
      const res = await fetch(frameUrl, { method: 'HEAD' })
      const isGif = res.headers.get('Content-Type')?.includes('gif')
      const isVideo = res.headers.get('Content-Type')?.includes('video')
      if (isGif) {
        type = CollectibleType.GIF
        gifUrl = frameUrl
        frameUrl = await getFrameFromGif(frameUrl, name || '')
      } else if (isVideo) {
        type = CollectibleType.VIDEO
        frameUrl = null
        videoUrl = imageUrls.find(url => !!url)!
      } else {
        imageUrl = imageUrls.find(url => !!url)!
      }
    }
  } catch (e) {
    console.error('Error processing collectible', e)
    type = CollectibleType.IMAGE
    frameUrl = imageUrls.find(url => !!url)!
    imageUrl = frameUrl
  }

  return {
    id: `${asset.token_id}:::${asset.asset_contract?.address ?? ''}`,
    tokenId: asset.token_id,
    name: asset.name,
    description: asset.description,
    type,
    frameUrl,
    imageUrl,
    videoUrl,
    gifUrl,
    isOwned: true,
    dateCreated: null,
    dateLastTransferred: null,
    externalLink: asset.external_link,
    permaLink: asset.permalink,
    assetContractAddress: asset.asset_contract?.address ?? null
  }
}

export const creationEventToCollectible = async (
  event: OpenSeaEvent
): Promise<Collectible> => {
  const { asset, created_date } = event

  const collectible = await assetToCollectible(asset)

  return {
    ...collectible,
    dateCreated: created_date,
    isOwned: false
  }
}

export const transferEventToCollectible = async (
  event: OpenSeaEvent,
  isOwned = true
): Promise<Collectible> => {
  const { asset, created_date } = event

  const collectible = await assetToCollectible(asset)

  return {
    ...collectible,
    isOwned,
    dateLastTransferred: created_date
  }
}

export const isNotFromNullAddress = (event: OpenSeaEvent) => {
  return event.from_account.address !== NULL_ADDRESS
}

const getFrameFromGif = async (url: string, name: string) => {
  const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
  const isSafariMobile =
    navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPhone/i)
  let preview
  try {
    // Firefox does not handle partial gif rendering well
    if (isFirefox || isSafariMobile) {
      throw new Error('partial gif not supported')
    }
    const req = await fetch(url, {
      headers: {
        // Extremely heuristic 200KB. This should contain the first frame
        // and then some. Rendering this out into an <img tag won't allow
        // animation to play. Some gifs may not load if we do this, so we
        // can try-catch it.
        Range: 'bytes=0-200000'
      }
    })
    const ab = await req.arrayBuffer()
    preview = new Blob([ab])
  } catch (e) {
    preview = await gifPreview(url)
  }

  return URL.createObjectURL(preview)
}

// ====================================
// ====================================
// ====================================

// VIDEO
//   .animation_url or.properties.category == video or .properties.files.findfirst(f => f.type.includes(video[with extension check ?])) or.properties.files.findfirst(f => getMimeType(f) == video[with extension check ?]or f.includes(https://watch.videodelivery.net/))
// if not.animation_url, use f.uri or f(files[0] if files.length === 1, otherwise files[1])
// use.image for video poster if exists
// if animation_url or f, use type = video / mp4
//   IMAGE
// use.image or f.uri or f
// maybe we don't need image check if gif and video have been eliminated in the process, has to be image

type NFTType = {
  collectibleType: CollectibleType
  url: string
  frameUrl: Nullable<string>
}

const nftGif = async (nft: SolanaNFT): Promise<Nullable<NFTType>> => {
  const gifFile = nft.properties.files?.find(
    file => typeof file === 'object' && file.type === 'image/gif'
  )
  if (gifFile) {
    const url = (gifFile as SolanaNFTPropertiesFile).uri
    const frameUrl = await getFrameFromGif(url, nft.name)
    return { collectibleType: CollectibleType.GIF, url, frameUrl }
  }
  return null
}

// const defaultVideoType = 'video/mp4'
const nftVideo = async (nft: SolanaNFT): Promise<Nullable<NFTType>> => {
  const files = nft.properties.files
  // should we restrict video file extensions here?
  // MP4, MOV, GLB
  // GLTF??
  // https://github.com/metaplex-foundation/metaplex/blob/81023eb3e52c31b605e1dcf2eb1e7425153600cd/js/packages/web/src/views/artCreate/index.tsx#L318
  // DO WE CARE ABOUT VR NFTs??
  const videoFile = files?.find(
    file => typeof file === 'object' && file.type.includes('video')
  ) as SolanaNFTPropertiesFile
  // https://github.com/metaplex-foundation/metaplex/blob/397ceff70b3524aa0543540584c7200c79b198a0/js/packages/web/src/components/ArtContent/index.tsx#L107
  const videoUrl = files?.find(
    file =>
      typeof file === 'string' &&
      file.startsWith('https://watch.videodelivery.net/')
  ) as string
  const isVideo =
    nft.properties.category === 'video' ||
    nft.animation_url ||
    videoFile ||
    videoUrl
  if (isVideo) {
    let url: string, videoType
    if (nft.animation_url) {
      url = nft.animation_url
      // videoType = defaultVideoType
    } else if (videoFile) {
      url = videoFile.uri
      videoType = videoFile.type
    } else if (videoUrl) {
      url = videoUrl // maybe videoUrl.replace('watch', 'iframe')?
      // videoType = defaultVideoType
    } else if (files?.length) {
      if (files.length === 1) {
        url = typeof files[0] === 'object' ? files[0].uri : files[0]
      } else {
        url = typeof files[1] === 'object' ? files[1].uri : files[1]
      }
      // videoType = defaultVideoType
    } else {
      return null
    }
    return {
      collectibleType: CollectibleType.VIDEO,
      url,
      frameUrl: nft.image || null
    }
    // return { collectibleType: CollectibleType.VIDEO, url, frameUrl: nft.image || null, videoType }
  }
  return null
}

const nftImage = async (nft: SolanaNFT): Promise<Nullable<NFTType>> => {
  const files = nft.properties.files
  // should we restrict image file extensions here?
  // PNG, JPG, GIF
  // https://github.com/metaplex-foundation/metaplex/blob/81023eb3e52c31b605e1dcf2eb1e7425153600cd/js/packages/web/src/views/artCreate/index.tsx#L316
  const imageFile = files?.find(
    file => typeof file === 'object' && file.type.includes('image')
  ) as SolanaNFTPropertiesFile
  const isImage =
    nft.properties.category === 'image' || nft.image.length || imageFile
  if (isImage) {
    let url
    if (nft.image.length) {
      url = nft.image
    } else if (imageFile) {
      url = imageFile.uri
    } else if (files?.length) {
      if (files.length === 1) {
        url = typeof files[0] === 'object' ? files[0].uri : files[0]
      } else {
        url = typeof files[1] === 'object' ? files[1].uri : files[1]
      }
    } else {
      return null
    }
    return { collectibleType: CollectibleType.IMAGE, url, frameUrl: url }
  }
  return null
}

const nftComputedMedia = async (nft: SolanaNFT): Promise<Nullable<NFTType>> => {
  const files = nft.properties.files
  if (!files?.length) {
    return null
  }
  const url = typeof files[0] === 'object' ? files[0].uri : files[0]
  // get mime type
  // make sure it's gif/video/image
  const mediaType = await fetch(url, { method: 'HEAD' })
  const contentType = mediaType.headers.get('Content-Type')
  const isGif = contentType?.includes('gif')
  const isVideo = contentType?.includes('video')
  if (isGif) {
    const frameUrl = await getFrameFromGif(url, nft.name)
    return { collectibleType: CollectibleType.GIF, url, frameUrl }
  }
  if (isVideo) {
    return { collectibleType: CollectibleType.VIDEO, url, frameUrl: null }
    // return { collectibleType: CollectibleType.VIDEO, url, frameUrl: null, videoType: contentType || defaultVideoType }
  }
  return { collectibleType: CollectibleType.IMAGE, url, frameUrl: url }
}

export const solanaNFTToCollectible = async (
  nft: SolanaNFT,
  address: string
): Promise<Collectible> => {
  const identifier = [
    nft.symbol,
    nft.name,
    nft.image /* this would not always be image e.g. could be video or gif?? */
  ]
    .filter(Boolean)
    .join(':::')

  const collectible = {
    id: identifier,
    tokenId: identifier,
    name: nft.name,
    description: nft.description,
    externalLink: nft.external_url,
    isOwned: true
  } as Collectible

  if (nft.properties.creators.some(creator => creator.address === address)) {
    collectible.isOwned = false
  }

  const { url, frameUrl, collectibleType } = ((await nftGif(nft)) ||
    (await nftVideo(nft)) ||
    (await nftImage(nft)) ||
    (await nftComputedMedia(nft))) as NFTType
  collectible.type = collectibleType
  if (collectibleType === CollectibleType.GIF) {
    collectible.gifUrl = url
  } else if (collectibleType === CollectibleType.VIDEO) {
    collectible.videoUrl = url
  } else if (collectibleType === CollectibleType.IMAGE) {
    collectible.imageUrl = url
  }
  collectible.frameUrl = frameUrl

  return collectible
}
