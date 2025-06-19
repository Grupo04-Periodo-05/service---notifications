import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

type EmailType = 'tarefa-vencendo' | 'esqueceu-senha';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly rabbitMQService: RabbitMQService) {
    this.transporter = nodemailer.createTransport({
      host: 'in-v3.mailjet.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async onModuleInit() {

    try {
      await this.rabbitMQService.consume('email_queue', async (msg) => {

        if (!msg || !msg.to || !msg.type) {
          this.logger.error('Mensagem inválida na fila email_queue. Dados:', msg);
          return;
        }

        try {
          await this.sendEmail(msg.type, msg.to, msg.data);
        } catch (error) {
          this.logger.error(`Erro ao processar envio de email: ${error.message}`, error.stack);
        }
      });

    } catch (err) {
      this.logger.error('Erro ao iniciar consumer da fila email_queue', err);
    }
  }

  private loadTemplate(type: EmailType): string {
    try {
      const filePath = path.join(__dirname, 'templates', `${type}.html`);
      const content = fs.readFileSync(filePath, 'utf-8');
      return content;
    } catch (error) {
      this.logger.error(`Erro ao carregar template ${type}: ${error.message}`);
      throw error;
    }
  }

  private renderTemplate(template: string, variables: Record<string, string>) {
    return template.replace(/{{(.*?)}}/g, (_, key) => {
      const value = variables[key.trim()] || '';
      if (value === '') {
        this.logger.warn(`Variável {{${key.trim()}}} não fornecida para o template`);
      }
      return value;
    });
  }

  async sendEmail(
    type: EmailType,
    to: string,
    variables: {
      nomeUsuario: string;
      tituloTarefa?: string;
      disciplina?: string;
      dataVencimento?: string;
      codigo?: string;
    },
  ) {
    debugger;

    const subjectMap = {
      'tarefa-vencendo': `📌 Tarefa prestes a vencer: ${variables.tituloTarefa || 'Sem título'}`,
      'esqueceu-senha': '🔐 Recuperação de senha',
    };

    try {
      const htmlTemplate = this.loadTemplate(type);
      const html = this.renderTemplate(htmlTemplate, {
        ...variables,
        dataAtual: new Date().toLocaleDateString('pt-BR'),
      });

      const mailOptions = {
        from: '"Notificações SGA" <s.g.a.integ@gmail.com>',
        to,
        subject: subjectMap[type],
        html,
      };


      const info = await this.transporter.sendMail(mailOptions);

      return info;
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar email para ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
