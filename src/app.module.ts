import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { ReciptToSheetModule } from './receipt-to-sheet/recipt-to-sheet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env"
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: `${configService.get('MONGO_URL')}${configService.get('MONGO_database')}${configService.get('MONGO_Query')}`
      }),
      inject: [ConfigService],
    }),
    ReciptToSheetModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
