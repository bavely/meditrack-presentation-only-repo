import { ObjectType } from '@nestjs/graphql';
import { ResponseType } from '../../common/dto/response.dto';
import { Device } from '../models/device.model';

@ObjectType()
export class DeviceResponse extends ResponseType(Device) {}
