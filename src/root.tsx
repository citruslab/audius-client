import React, { useState, useEffect, useCallback, lazy } from 'react'

import { useIsMobile, isElectron } from 'utils/clientUtil'

import { BackendDidSetup } from 'services/native-mobile-interface/lifecycle'
import Dapp from './app'
import { getCurrentUserExists } from 'services/LocalStorage'
import { setupMobileLogging } from 'services/Logging'

const REACT_APP_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const NoConnectivityPage = lazy(() =>
  import('components/no-connectivity-page/NoConnectivityPage')
)

const PublicSite = lazy(() => import('./publicSite'))

const validPublicSitePathnames = [
  '',
  'press',
  'legal/terms-of-use',
  'legal/privacy-policy'
]

const publicSiteSubPathnames = [
  'press',
  'legal/terms-of-use',
  'legal/privacy-policy'
]

const isPublicSiteRoute = (location = window.location) => {
  const pathname = location.pathname.slice(1).toLowerCase()
  return validPublicSitePathnames.includes(pathname)
}

const isPublicSiteSubRoute = (location = window.location) => {
  const pathname = location.pathname.slice(1).toLowerCase()
  return publicSiteSubPathnames.includes(pathname)
}

const clientIsElectron = isElectron()

const Root = () => {
  const [dappReady, setDappReady] = useState(false)
  const [connectivityFailure, setConnectivityFailure] = useState(false)
  const [renderPublicSite, setRenderPublicSite] = useState(isPublicSiteRoute())
  const isMobileClient = useIsMobile()
  const foundUser = getCurrentUserExists()

  useEffect(() => {
    // TODO: listen to history and change routes based on history...
    window.onpopstate = () => {
      setRenderPublicSite(isPublicSiteRoute())
    }
  }, [])

  const setReady = useCallback(() => setDappReady(true), [])

  useEffect(() => {
    if (dappReady || connectivityFailure) {
      new BackendDidSetup().send()
    }
  }, [connectivityFailure, dappReady])

  useEffect(() => {
    setupMobileLogging()
  }, [])

  const [shouldShowPopover, setShouldShowPopover] = useState(true)

  const shouldRedirectToApp = foundUser && !isPublicSiteSubRoute()
  if (
    renderPublicSite &&
    !clientIsElectron &&
    !REACT_APP_NATIVE_MOBILE &&
    !shouldRedirectToApp
  ) {
    return (
      <React.Suspense
        fallback={<div style={{ width: '100vw', height: '100vh' }} />}
      >
        <PublicSite
          isMobile={isMobileClient}
          onClickAppRedirect={() => setShouldShowPopover(false)}
          onDismissAppRedirect={() => setShouldShowPopover(false)}
          setRenderPublicSite={setRenderPublicSite}
        />
      </React.Suspense>
    )
  }

  return (
    <>
      {connectivityFailure && <NoConnectivityPage />}
      <Dapp
        isReady={dappReady}
        setReady={setReady}
        setConnectivityFailure={setConnectivityFailure}
        shouldShowPopover={shouldShowPopover}
      />
    </>
  )
}

export default Root
