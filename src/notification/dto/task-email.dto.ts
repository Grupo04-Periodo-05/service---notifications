import { IsEmail, IsEnum, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmailType } from './email-type.enum';

export class TaskReminderEmailDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ enum: EmailType, example: EmailType.TAREFA_VENCENDO })
  @IsEnum(EmailType)
  type: EmailType.TAREFA_VENCENDO;

  @ApiProperty({
    example: {
      nomeUsuario: 'João Silva',
      tituloTarefa: 'Atividade de Matemática',
      disciplina: 'Matemática',
      dataVencimento: '2025-06-25',
    },
  })
  @IsObject()
  @IsNotEmpty()
  data: {
    nomeUsuario: string;
    tituloTarefa: string;
    disciplina: string;
    dataVencimento: string;
  };
}
