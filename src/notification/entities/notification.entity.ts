import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'varchar', name: 'recipient_id' })
  recipientId: string;

  @Column({ type: 'jsonb' })
  content: {
    taskId: string;
    taskTitle: string;
  };

  @Column({ type: 'varchar', default: 'unread' })
  status: string;

  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  readAt: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;
}