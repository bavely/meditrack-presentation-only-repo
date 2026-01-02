import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { ParselabelResponse } from './dto/ai-label-response';
import { GqlAuthGuard } from '../common/guards/gql-auth-guard';
import { ParsedLabel } from './models/ai-label-response';
import { InstructionResponse } from './dto/ai-instruction-response.dto';
import { MedicationInstruction } from './models/medication-instruction.model';
import { MedicationInfoService } from './medication-info.service';
import {
  AiConversationListResponse,
  AiConversationResponse,
  DeleteConversationResponse,
  MedicationInfoResponse,
} from './dto/medication-info-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
const emptyParsedLabel = (): ParsedLabel => ({
    name: '',
    strength: '',
    quantity: '',
    instructions: '',
    therapy: '',
});

@Resolver()
export class AiResolver {
    private readonly logger = new Logger(AiResolver.name);
    constructor(
        private readonly aiService: AiService,
        private readonly medicationInfoService: MedicationInfoService,
    ) {}

    @Mutation(() => ParselabelResponse)
    @UseGuards(GqlAuthGuard)
    async parseMedicationLabel(@Args('label') label: string): Promise<ParselabelResponse> {
        try {
            this.logger.debug(`Parsing medication label: ${label.slice(0, 100)}...`);
            
            // Validate input
            if (!label || label.trim().length === 0) {
                return {
                    success: false,
                    errors: [
                        {
                            field: 'label',
                            message: 'Label text is required and cannot be empty'
                        }
                    ],
                    data: emptyParsedLabel()
                };
            }

            // Call AI service
            const result = await this.aiService.callAiParser(label);
            this.logger.debug(`AI parser result: ${result}`);

            // Validate that we got a response
            if (!result) {
                return {
                    success: false,
                    errors: [
                        {
                            field: 'ai_service',
                            message: 'AI service returned no response'
                        }
                    ],
                    data: emptyParsedLabel()
                };
            }

            // Try to parse JSON to validate it's proper JSON
            let parsedResult;
            try {
                parsedResult = JSON.parse(result);
            } catch (parseError) {
                this.logger.error(`Failed to parse AI response as JSON: ${parseError.message}`);
                return {
                    success: false,
                    errors: [
                        {
                            field: 'ai_response',
                            message: 'AI service returned invalid JSON format'
                        }
                    ],
                    data: emptyParsedLabel()
                };
            }

            // Validate required fields in the parsed result (This validation not suitable for this context)
            // const validationErrors = this.aiService.validateMedicationData(parsedResult);
            // console.log(validationErrors);
            // if (validationErrors.length > 0) {
            //     return {
            //         success: false,
            //         errors: validationErrors,
            //         data: emptyParsedLabel()
            //     };
            // }
            this.logger.debug('Result from AI resolver', {
                success: true,
                errors: [],
                data: {
                    name: parsedResult.name,
                    strength: parsedResult.strength,
                    quantity: parsedResult.quantity,
                    instructions: parsedResult.instructions,
                    therapy: parsedResult.therapy,
                },
            });
            // Return successful response with JSON string data
            return {
                success: true,
                errors: [],
                data: {
                    name: parsedResult.name || '',
                    strength: parsedResult.strength || '',
                    quantity: parsedResult.quantity || '',
                    instructions: parsedResult.instructions || '',
                    therapy: parsedResult.therapy || ''
                } // Return the JSON string as expected
            };

        } catch (error) {
            this.logger.error(`Error in parseMedicationLabel: ${error.message}`, error.stack);
            
            // Handle specific error types
            if (error.message.includes('OpenAI API error')) {
                return {
                    success: false,
                    errors: [
                        {
                            field: 'openai_api',
                            message: 'External AI service is currently unavailable. Please try again later.'
                        }
                    ],
                    data: emptyParsedLabel()
                };
            }

            if (error.message.includes('API key')) {
                return {
                    success: false,
                    errors: [
                        {
                            field: 'configuration',
                            message: 'AI service configuration error. Please contact support.'
                        }
                    ],
                    data: emptyParsedLabel()
                };
            }

            // Generic error fallback
            return {
                success: false,
                errors: [
                    {
                        field: 'general',
                        message: 'An unexpected error occurred while parsing the medication label'
                    }
                ],
                data: emptyParsedLabel()
            };
        }
    }

  @Mutation(() => InstructionResponse)
  @UseGuards(GqlAuthGuard)
async structureMedicationInstruction(
    @Args('instruction') instruction: string,
    @Args('medicationName', { nullable: true }) medicationName?: string,
  ): Promise<InstructionResponse> {
    try {
      if (!instruction || instruction.trim().length === 0) {
        return {
          success: false,
          errors: [{ field: 'instruction', message: 'Instruction text is required' }],
          data: undefined as any,
        };
      }

      const data: MedicationInstruction = await this.aiService.structureMedicationInstruction(
        instruction,
        medicationName,
      );
      this.logger.debug('Structured instruction generated');
      return { success: true, errors: [], data };
    } catch (error) {
      this.logger.error(`Error in structureMedicationInstruction: ${error.message}`);
      return {
        success: false,
        errors: [{ field: 'ai_service', message: 'Failed to structure medication instruction' }],
        data: undefined as any,
      };
    }
  }

  @Mutation(() => MedicationInfoResponse)
  @UseGuards(GqlAuthGuard)
  async getMedicationInfo(
    @Args('prompt') prompt: string,
    @CurrentUser() user,
    @Args('conversationId', { type: () => String, nullable: true }) conversationId?: string,
  ): Promise<MedicationInfoResponse> {
    try {
      const sanitizedPrompt = prompt?.trim();
      const sanitizedConversationId = conversationId?.trim() || undefined;

      if (!sanitizedPrompt) {
        return {
          success: false,
          errors: [{ field: 'prompt', message: 'Prompt is required' }],
        };
      }

      if (!user?.sub) {
        this.logger.error('Authenticated user is missing a sub claim in getMedicationInfo');
        return {
          success: false,
          errors: [{ field: 'auth', message: 'Unable to identify the current user' }],
        };
      }

      const conversation = await this.medicationInfoService.getMedicationInfo(
        user.sub,
        sanitizedPrompt,
        sanitizedConversationId,
      );

      return {
        success: true,
        errors: [],
        data: {
          conversationId: conversation.conversationId,
          title: conversation.title ?? undefined,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          messages: conversation.messages,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while retrieving medication information';

      this.logger.error(`Error in getMedicationInfo: ${message}`, error instanceof Error ? error.stack : undefined);

      return {
        success: false,
        errors: [{ field: 'ai_service', message: 'Failed to retrieve medication information' }],
      };
    }
  }

  @Query(() => AiConversationListResponse)
  @UseGuards(GqlAuthGuard)
  async aiConversations(@CurrentUser() user): Promise<AiConversationListResponse> {
    if (!user?.sub) {
      this.logger.error('Authenticated user is missing a sub claim in aiConversations');
      return {
        success: false,
        errors: [{ field: 'auth', message: 'Unable to identify the current user' }],
      };
    }

    try {
      const conversations = await this.medicationInfoService.listConversations(user.sub);

      return {
        success: true,
        errors: [],
        data: conversations.map((conversation) => ({
          conversationId: conversation.conversationId,
          title: conversation.title ?? undefined,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        })),
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while loading AI conversations';

      this.logger.error(
        `Error in aiConversations: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        success: false,
        errors: [{ field: 'ai_service', message: 'Failed to load AI conversations' }],
      };
    }
  }

  @Query(() => AiConversationResponse)
  @UseGuards(GqlAuthGuard)
  async aiConversation(
    @Args('conversationId') conversationId: string,
    @CurrentUser() user,
  ): Promise<AiConversationResponse> {
    const sanitizedConversationId = conversationId?.trim();

    if (!sanitizedConversationId) {
      return {
        success: false,
        errors: [{ field: 'conversationId', message: 'Conversation ID is required' }],
      };
    }

    if (!user?.sub) {
      this.logger.error('Authenticated user is missing a sub claim in aiConversation');
      return {
        success: false,
        errors: [{ field: 'auth', message: 'Unable to identify the current user' }],
      };
    }

    try {
      const conversation = await this.medicationInfoService.getConversation(
        user.sub,
        sanitizedConversationId,
      );

      return {
        success: true,
        errors: [],
        data: {
          conversationId: conversation.conversationId,
          title: conversation.title ?? undefined,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          messages: conversation.messages,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while retrieving the AI conversation';

      this.logger.error(
        `Error in aiConversation: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof Error && error.message === 'Conversation not found.') {
        return {
          success: false,
          errors: [{ field: 'conversationId', message: 'Conversation not found' }],
        };
      }

      return {
        success: false,
        errors: [{ field: 'ai_service', message: 'Failed to load AI conversation' }],
      };
    }
  }
// Response and error type should comply with the standard structure
  @Mutation(() => DeleteConversationResponse)
  @UseGuards(GqlAuthGuard)
  async deleteConversation(
    @Args('conversationId') conversationId: string,
    @CurrentUser() user,
  ): Promise<DeleteConversationResponse> {
    console.log('deleteConversation called with conversationId:', conversationId);
    if (!user?.sub) {
      this.logger.error('Authenticated user is missing a sub claim in deleteConversation');
      return {
        success: false,
        errors: [{ field: 'auth', message: 'Unable to identify the current user' }],
      };
    }

    try {
      await this.medicationInfoService.deleteConversation(user.sub, conversationId);
      return {
        success: true,
        errors: [],
        data:  { conversationId },
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while deleting the AI conversation';

      this.logger.error(`Error in deleteConversation: ${message}`, error instanceof Error ? error.stack : undefined);
      return {
        success: false,
        errors: [{ field: 'ai_service', message: 'Failed to delete AI conversation' }],
      };
    }
  }


}
