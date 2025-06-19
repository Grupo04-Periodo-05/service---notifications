import { IsEmail, IsEnum, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmailType } from './email-type.enum';

export class ForgotPasswordEmailDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ enum: EmailType, example: EmailType.ESQUECEU_SENHA })
  @IsEnum(EmailType)
  type: EmailType.ESQUECEU_SENHA;

  @ApiProperty({
    example: {
      nomeUsuario: 'João Silva',
      codigo: 'ABC123',
    },
  })
  @IsObject()
  @IsNotEmpty()
  data: {
    nomeUsuario: string;
    codigo: string;
  };
}
