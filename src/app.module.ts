import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { ReciptToSheetModule } from './recipt-to-sheet/recipt-to-sheet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env"
    }),
    ReciptToSheetModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
