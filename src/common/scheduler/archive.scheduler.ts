import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification } from '../../notification/entities/notification.entity';


@Injectable()
export class ArchiveScheduler {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  @Cron('0 0 * * *')
  async archiveOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await this.notificationRepository.update(
      { createdAt: LessThan(thirtyDaysAgo) },
      { status: 'archived' }
    );
  }
}