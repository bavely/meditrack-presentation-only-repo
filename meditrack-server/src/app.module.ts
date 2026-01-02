import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ConfigurationModule } from './config/config.module';
import { ScheduleModule as CronScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MedicationModule } from './medication/medication.module';
import { MedicationScheduleModule } from './schedule/schedule.module';
import { DoseActionModule } from './dose-action/dose-action.module';
import { AiModule } from './ai/ai.module';
import { UserModule } from './user/user.module';
import { ReminderModule } from './reminder/reminder.module';
import { GraphqlExceptionInterceptor } from './common/interceptors/graphql-exception.interceptor';
import { DeviceModule } from './device/device.module';
@Module({
  imports: [
    ConfigurationModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      context: ({ req }) => ({ req }),
    }),
    CronScheduleModule.forRoot(),
    AuthModule,
    PrismaModule,
    MedicationModule,
    MedicationScheduleModule,
    DoseActionModule,
    AiModule,
    ReminderModule,
    UserModule,
    DeviceModule,
    // NotificationsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: GraphqlExceptionInterceptor,
    }
  ],
})
export class AppModule {}
