import React from 'react'

import ActionSheetModal from 'components/action-sheet-modal/ActionSheetModal'
import { ID } from 'models/common/Identifiers'

type UnfollowConfirmationModalProps = {
  isOpen: boolean
  onClose: () => void
  unfollowUser: (userId: ID) => void
  userId: ID
}

const messages = {
  unfollow: 'Unfollow',
  cancel: 'Cancel'
}

const actions = [
  { text: messages.unfollow, isDestructive: true },
  { text: messages.cancel }
]

const UnfollowConfirmationModal = ({
  isOpen,
  onClose,
  userId,
  unfollowUser
}: UnfollowConfirmationModalProps) => {
  const actionCallbacks = [
    () => {
      unfollowUser(userId)
      onClose()
    },
    () => {
      onClose()
    }
  ]

  const didSelectRow = (row: number) => {
    actionCallbacks[row]()
  }

  return (
    <ActionSheetModal
      isOpen={isOpen}
      onClose={onClose}
      actions={actions}
      didSelectRow={didSelectRow}
    />
  )
}

export default UnfollowConfirmationModal
