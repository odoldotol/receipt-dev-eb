import { Module } from '@nestjs/common';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { ReciptToSheetModule } from './recipt-to-sheet/recipt-to-sheet.module';

@Module({
  imports: [ReciptToSheetModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
