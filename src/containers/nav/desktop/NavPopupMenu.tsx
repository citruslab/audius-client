import React from 'react'

import {
  IconCrown,
  IconDashboard,
  IconSettings,
  PopupMenu,
  PopupMenuItem,
  PopupPosition
} from '@audius/stems'
import cn from 'classnames'

import { ReactComponent as IconKebabHorizontal } from 'assets/img/iconKebabHorizontalAlt.svg'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { getAccountIsCreator } from 'store/account/selectors'
import { useSelector } from 'utils/reducer'
import { AUDIO_PAGE, DASHBOARD_PAGE, SETTINGS_PAGE } from 'utils/route'
import { removeNullable } from 'utils/typeUtils'
import zIndex from 'utils/zIndex'

import styles from './NavPopupMenu.module.css'

const messages = {
  settings: 'Settings',
  dashboard: 'Artist Dashboard',
  audio: '$AUDIO & Rewards'
}

const useIsCreator = () => {
  return useSelector(getAccountIsCreator)
}

const NavPopupMenu = () => {
  const navigate = useNavigateToPage()
  const isCreator = useIsCreator()

  const menuItems: PopupMenuItem[] = [
    {
      text: messages.settings,
      onClick: () => navigate(SETTINGS_PAGE),
      icon: <IconSettings />,
      iconClassName: styles.menuItemIcon
    },
    isCreator
      ? {
          text: messages.dashboard,
          onClick: () => navigate(DASHBOARD_PAGE),
          icon: <IconDashboard />,
          iconClassName: styles.menuItemIcon
        }
      : null,
    {
      text: messages.audio,
      className: styles.rewardsMenuItem,
      onClick: () => navigate(AUDIO_PAGE),
      icon: <IconCrown />,
      iconClassName: cn(styles.menuItemIcon, styles.crownIcon)
    }
  ].filter(removeNullable)

  return (
    <div className={styles.headerIconWrapper}>
      <PopupMenu
        items={menuItems}
        position={PopupPosition.BOTTOM_RIGHT}
        renderTrigger={(anchorRef, triggerPopup) => {
          return (
            <div className={styles.icon} ref={anchorRef} onClick={triggerPopup}>
              <IconKebabHorizontal />
            </div>
          )
        }}
        zIndex={zIndex.NAVIGATOR_POPUP}
      />
    </div>
  )
}

export default NavPopupMenu
