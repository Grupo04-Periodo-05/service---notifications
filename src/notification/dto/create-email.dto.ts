import { IsEmail, IsNotEmpty, IsObject, IsEnum, IsOptional, IsString } from 'class-validator';

export enum EmailType {
  TAREFA_VENCENDO = 'tarefa-vencendo',
  ESQUECEU_SENHA = 'esqueceu-senha',
}

export class CreateEmailDto {
  @IsEmail()
  to: string;

@IsOptional()
  @IsString()
  recipientId?: string;

  @IsEnum(EmailType)
  type: EmailType;

  @IsObject()
  @IsNotEmpty()
  data: {
    nomeUsuario: string;
    tituloTarefa?: string;
    disciplina?: string;
    dataVencimento?: string;
    codigo?: string;
  };
}
