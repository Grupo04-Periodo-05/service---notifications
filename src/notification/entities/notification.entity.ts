// src/notification/entities/notification.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NotificationContent } from '../classes/notification-content.class';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'varchar', name: 'recipient_id' })
  recipientId: string;

  @Column({ 
    type: 'jsonb',
    transformer: {
      to: (value: NotificationContent) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value)
    }
  })
  content: NotificationContent;

  @Column({ type: 'varchar', default: 'unread' })
  status: string;

  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  readAt: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;
}