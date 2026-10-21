import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserAvatarService } from './avatar/user-avatar.service';
import { AVATAR_MAX_BYTES } from './avatar/avatar-validation';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
  constructor(
    private readonly usersService: UsersService,
    private readonly avatars: UserAvatarService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Put('me/avatar')
  @ApiOperation({ summary: 'Alterar foto do usuário autenticado (até 5 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Imagem ausente ou formato inválido.',
  })
  @ApiResponse({ status: 413, description: 'Imagem acima de 5 MB.' })
  @ApiResponse({
    status: 503,
    description: 'Storage indisponível ou não configurado.',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: AVATAR_MAX_BYTES, files: 1, fields: 0 },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.avatars.upload(user.id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/avatar')
  @ApiOperation({ summary: 'Remover foto do usuário autenticado' })
  removeAvatar(@CurrentUser() user: AuthenticatedUser) {
    return this.avatars.remove(user.id);
  }

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
