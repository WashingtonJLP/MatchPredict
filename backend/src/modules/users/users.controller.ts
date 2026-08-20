import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserStatisticsResponseDto } from './dto/user-statistics-response.dto';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário.' })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido.' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/statistics')
  @ApiOperation({ summary: 'Obter estatísticas do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas do usuário autenticado.',
    type: UserStatisticsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido.' })
  getStatistics(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findMyStatistics(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Atualizar perfil do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado.' })
  @ApiResponse({ status: 401, description: 'JWT ausente ou inválido.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, updateUserDto);
  }
}
