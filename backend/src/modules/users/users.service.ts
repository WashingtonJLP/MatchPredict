import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const userAlreadyExists = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });

    if (userAlreadyExists) {
      throw new ConflictException('Já existe um usuário com esse e-mail.');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      10,
    );

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
      },
    });

    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new UnauthorizedException('Usuário não encontrado.');
  }

  const data: any = {};

  if (updateUserDto.name) {
    data.name = updateUserDto.name;
  }

  if (updateUserDto.newPassword) {
    if (!updateUserDto.currentPassword) {
      throw new BadRequestException(
        'Informe a senha atual para alterar a senha.',
      );
    }

    const passwordMatch = await bcrypt.compare(
      updateUserDto.currentPassword,
      user.password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Senha atual incorreta.');
    }

    data.password = await bcrypt.hash(updateUserDto.newPassword, 10);
  }

  return this.prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }
}
