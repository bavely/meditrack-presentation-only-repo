import { ObjectType } from '@nestjs/graphql';
import { ResponseType } from '../../common/dto/response.dto';
import { MedicationInstruction } from '../models/medication-instruction.model';

@ObjectType()
export class InstructionResponse extends ResponseType<MedicationInstruction>(
  MedicationInstruction,
) {}

