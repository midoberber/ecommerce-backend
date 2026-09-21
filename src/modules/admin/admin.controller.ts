import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator.js';
import { AdminService } from './admin.service.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { BlockUserDto } from './dto/block-user.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    const [stats, salesTrend, ordersByStatus] = await Promise.all([
      this.adminService.getStats(),
      this.adminService.getSalesTrend(),
      this.adminService.getOrdersByStatus(),
    ]);

    return { ...stats, salesTrend, ordersByStatus };
  }

  @Get('users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Patch('users/:id/block')
  setBlocked(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: BlockUserDto,
  ) {
    return this.adminService.setBlocked(admin.userId, id, dto);
  }

  @Get('orders')
  findAllOrders() {
    return this.adminService.findAllOrders();
  }

  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.adminService.updateOrderStatus(id, dto);
  }
}
