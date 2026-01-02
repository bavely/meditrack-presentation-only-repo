import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureOpenAI } from 'openai';

import {
  AiConversation as PrismaAiConversation,
  AiMessage as PrismaAiMessage,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface ConversationMessage {
  id: string;
  role: string;
  content: string;
  timestamp: Date;
}

export interface ConversationResult {
  conversationId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: ConversationMessage[];
}

export interface ConversationSummary {
  conversationId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AiConversationRecord {
  id: string;
  userId: string;
  title?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AiMessageRecord {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MedicationInfoService {
  private readonly logger = new Logger(MedicationInfoService.name);
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly apiVersion: string;
  private readonly deployment: string;
  private readonly openai: AzureOpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.endpoint = this.getRequired('AZURE_OPENAI_ENDPOINT');
    this.apiKey = this.getRequired('AZURE_OPENAI_API_KEY');
    this.apiVersion = this.getRequired('AZURE_OPENAI_API_VERSION');
    this.deployment = this.getRequired('AZURE_OPENAI_DEPLOYMENT');

    this.openai = new AzureOpenAI({
      endpoint: this.endpoint,
      apiKey: this.apiKey,
      apiVersion: this.apiVersion,
      deployment: this.deployment,
    });
  }

  private getRequired(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`${key} environment variable is not set`);
    }
    return value;
  }

  private mapMessage(message: PrismaAiMessage): ConversationMessage {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.createdAt,
    };
  }

  private mapConversation(
    conversation: PrismaAiConversation,
    messages: PrismaAiMessage[],
  ): ConversationResult {
    return {
      conversationId: conversation.id,
      title: conversation.title ?? null,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: messages.map((message) => this.mapMessage(message)),
    };
  }

  private mapSummary(conversation: PrismaAiConversation): ConversationSummary {
    return {
      conversationId: conversation.id,
      title: conversation.title ?? null,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  async getMedicationInfo(
    userId: string,
    prompt: string,
    conversationId?: string,
  ): Promise<ConversationResult> {
    try {

      const prismaClient = this.prisma as unknown as {
        aiConversation: {
          findFirst: (args: any) => Promise<AiConversationRecord | null>;
          create: (args: any) => Promise<AiConversationRecord>;
        };
        aiMessage: {
          create: (args: any) => Promise<AiMessageRecord>;
          findMany: (args: any) => Promise<AiMessageRecord[]>;
        };
      };

      const { aiConversation, aiMessage } = prismaClient;

      let conversation: AiConversationRecord | null = null;

      if (conversationId) {
        try {
          conversation = await aiConversation.findFirst({
            where: { id: conversationId, userId },
          });

          if (!conversation) {
            this.logger.warn(
              `Conversation ${conversationId} not found for user ${userId}. A new conversation will be created.`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to load AI conversation ${conversationId} for user ${userId}`,
            error instanceof Error ? error.stack : undefined,
          );
          throw new Error('Unable to load conversation history.');
        }
      }

      if (!conversation) {
        try {
          conversation = await aiConversation.create({
            data: { userId },
          });
        } catch (error) {
          this.logger.error(
            `Failed to create AI conversation for user ${userId}`,
            error instanceof Error ? error.stack : undefined,
          );
          throw new Error('Unable to start a new conversation.');
        }
      }

      if (!conversation) {
        this.logger.error('Conversation instance was not initialized before storing AI messages.');
        throw new Error('Unable to initialize the conversation.');
      }

      try {
        await aiMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'user',
            content: prompt,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to store AI user message for conversation ${conversation.id}`,
          error instanceof Error ? error.stack : undefined,
        );
        throw new Error('Unable to record your message.');
      }

      let history: AiMessageRecord[];
      try {
        history = await aiMessage.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: 'asc' },
        });
      } catch (error) {
        this.logger.error(
          `Failed to load AI conversation history for conversation ${conversation.id}`,
          error instanceof Error ? error.stack : undefined,
        );
        throw new Error('Unable to load conversation history.');
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful medication information assistant. Provide concise, evidence-based details about medications, including indications, dosing considerations, and potential side effects.',
          },
          ...history.map((message) => ({
            role: message.role as 'user' | 'assistant' | 'system',
            content: message.content,
          })),
        ],
      });

      const content = response.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('Azure OpenAI returned an empty response.');
      }

      const finalMessage = `${content}\n\nAlways consult a physician to confirm this information.`;

      let assistantMessage: AiMessageRecord;
      try {
        assistantMessage = await aiMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: finalMessage,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to store AI assistant message for conversation ${conversation.id}`,
          error instanceof Error ? error.stack : undefined,
        );
        throw new Error('Unable to store the assistant response.');
      }

      const updatedHistory = [...history, assistantMessage];

      let updatedConversation: PrismaAiConversation | null = null;
      try {
        updatedConversation = await this.prisma.aiConversation.update({
          where: { id: conversation.id },
          data: { title: conversation.title ?? null },
        });
      } catch (error) {
        this.logger.error(
          `Failed to update AI conversation metadata for conversation ${conversation.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }

      const conversationMeta: PrismaAiConversation =
        updatedConversation ??
        {
          ...conversation,
          updatedAt: new Date(),
          title: conversation.title ?? null, // Ensure title is always string|null
        };

      return this.mapConversation(conversationMeta, updatedHistory);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to retrieve medication information: ${error.message}`, error.stack);
        throw error;
      }

      this.logger.error('Failed to retrieve medication information');
      throw new Error('Failed to retrieve medication information');
    }
  }

  async listConversations(userId: string): Promise<ConversationSummary[]> {
    try {
      const conversations = await this.prisma.aiConversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      return conversations.map((conversation) => this.mapSummary(conversation));
    } catch (error) {
      this.logger.error(
        `Failed to load AI conversations for user ${userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error('Unable to load conversations.');
    }
  }

  async getConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationResult> {
    let conversation: PrismaAiConversation | null = null;

    try {
      conversation = await this.prisma.aiConversation.findFirst({
        where: { id: conversationId, userId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to load AI conversation ${conversationId} for user ${userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error('Unable to load the requested conversation.');
    }

    if (!conversation) {
      throw new Error('Conversation not found.');
    }

    let messages: PrismaAiMessage[];
    try {
      messages = await this.prisma.aiMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to load AI messages for conversation ${conversation.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error('Unable to load conversation messages.');
    }

    return this.mapConversation(conversation, messages);
  }


  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    let conversation: PrismaAiConversation | null = null;

    try {
      conversation = await this.prisma.aiConversation.findFirst({
        where: { id: conversationId, userId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to load AI conversation ${conversationId} for user ${userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error('Unable to load the requested conversation.');
    }

    if (!conversation) {
      throw new Error('Conversation not found.');
    }

    try {
      await this.prisma.aiConversation.delete({
        where: { id: conversation.id },
      });
    } catch (error) {
      this.logger.error(
        `Failed to delete AI conversation ${conversation.id} for user ${userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error('Unable to delete the conversation.');
    }
    }
}
