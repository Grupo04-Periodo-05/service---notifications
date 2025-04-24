import { Body, Controller, Get, Param, Patch, Post, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationResponse } from './dto/notification.response';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @HttpCode(201)  // garante status 201
  @ApiOperation({ summary: 'Create notification' })
  @ApiResponse({ status: 201, type: NotificationResponse })
  async create(@Body() createDto: CreateNotificationDto) {
    return this.notificationService.createNotification(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, type: NotificationResponse })
  async findOne(@Param('id') id: string) {
    return this.notificationService.findOne(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark as read' })
  @ApiResponse({ status: 200, type: NotificationResponse })
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
}