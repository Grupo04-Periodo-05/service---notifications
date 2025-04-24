// notification-status.enum.ts
export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  GROUP_INVITE = 'group_invite',
  CHAT_MESSAGE = 'chat_message'
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
  SENT = 'sent', // Alterado para lowercase
  PENDING = 'pending' // Alterado para lowercase
}