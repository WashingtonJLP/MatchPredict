import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { AdminPaginationQueryDto } from './dto/admin-pagination-query.dto';
import { AdminParticipationsQueryDto } from './dto/admin-participations-query.dto';
import { AdminPaymentsQueryDto } from './dto/admin-payments-query.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { UserAvatarService } from '../users/avatar/user-avatar.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly avatars: UserAvatarService,
  ) {}

  @Delete('users/:id/avatar')
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  @ApiOperation({ summary: 'Remover somente a foto de perfil, com auditoria' })
  removeUserAvatar(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
    @Query() query: Record<string, unknown>,
    @Headers('content-type') contentType?: string,
  ) {
    if (
      (body != null &&
        (typeof body !== 'object' || Object.keys(body).length > 0)) ||
      Object.keys(query).length > 0 ||
      (contentType && !contentType.startsWith('application/json'))
    ) {
      throw new BadRequestException(
        'Informe somente o ID do usuário na URL, sem arquivo ou outros dados.',
      );
    }
    return this.avatars.removeByAdmin(admin.id, id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Resumo administrativo sob demanda' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('periods')
  @ApiOperation({ summary: 'Listar períodos recentes para filtros' })
  getPeriods() {
    return this.adminService.getPeriods();
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar usuários com paginação' })
  getUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id/deletion-impact')
  @ApiOperation({ summary: 'Analisar impacto da exclusão de um usuário' })
  getUserDeletionImpact(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.adminService.getUserDeletionImpact(admin.id, id);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Detalhar usuário sem dados sensíveis' })
  getUser(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.adminService.getUser(id);
  }

  @Delete('users/:id')
  @Throttle({ default: { limit: 3, ttl: 600_000 } })
  @ApiOperation({ summary: 'Excluir definitivamente usuário de teste' })
  deleteUser(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: DeleteUserDto,
  ) {
    return this.adminService.deleteUser(admin.id, id, dto.confirmation);
  }

  @Patch('users/:id/disable')
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  @ApiOperation({ summary: 'Desativar conta preservando o histórico' })
  disableUser(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.adminService.disableUser(admin.id, id);
  }

  @Patch('users/:id/reactivate')
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  @ApiOperation({ summary: 'Reativar conta sem alterar o histórico' })
  reactivateUser(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.adminService.reactivateUser(admin.id, id);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Listar pagamentos administrativos paginados' })
  getPayments(@Query() query: AdminPaymentsQueryDto) {
    return this.adminService.getPayments(query);
  }

  @Get('participations')
  @ApiOperation({ summary: 'Listar participações administrativas paginadas' })
  getParticipations(@Query() query: AdminParticipationsQueryDto) {
    return this.adminService.getParticipations(query);
  }

  @Get('financial-reviews')
  @ApiOperation({ summary: 'Listar pendências financeiras observacionais' })
  getFinancialReviews(@Query() query: AdminPaginationQueryDto) {
    return this.adminService.getFinancialReviews(query);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Listar auditoria administrativa paginada' })
  getAuditLogs(@Query() query: AdminPaginationQueryDto) {
    return this.adminService.getAuditLogs(query);
  }
}
