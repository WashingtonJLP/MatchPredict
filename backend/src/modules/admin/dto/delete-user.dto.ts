import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsString } from 'class-validator';

export class DeleteUserDto {
  @ApiProperty({ example: 'EXCLUIR' })
  @IsString()
  @Equals('EXCLUIR')
  confirmation!: 'EXCLUIR';
}
