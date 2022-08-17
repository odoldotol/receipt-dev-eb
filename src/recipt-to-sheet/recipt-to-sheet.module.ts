import { Module } from '@nestjs/common';
import { ReciptToSheetController } from './recipt-to-sheet.controller';
import { ReciptToSheetService } from './recipt-to-sheet.service';

@Module({
  controllers: [ReciptToSheetController],
  providers: [ReciptToSheetService]
})
export class ReciptToSheetModule {}
