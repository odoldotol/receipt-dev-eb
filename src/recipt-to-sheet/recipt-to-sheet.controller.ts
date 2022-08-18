import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReciptToSheetService } from './recipt-to-sheet.service';

@Controller('recipt-to-sheet')
export class ReciptToSheetController {
    constructor(private readonly reciptToSheetService: ReciptToSheetService) {}

    @Post()
    @UseInterceptors(FileInterceptor('reciptImage'/*, {options} */))
    async processingTransferredReceipt<T>(@UploadedFile() reciptImage: Express.Multer.File, @Body() multipartBody: T) {
        return this.reciptToSheetService.processingTransferredReceipt(reciptImage, multipartBody);
    }
}
