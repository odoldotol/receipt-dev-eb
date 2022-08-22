import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReciptToSheetService } from './recipt-to-sheet.service';

@Controller('recipt-to-sheet')
export class ReciptToSheetController {
    constructor(private readonly reciptToSheetService: ReciptToSheetService) {}

    @Post()
    @UseInterceptors(FileInterceptor('reciptImage'/*, {options} */))
    async processingTransferredReceipt<T>(@UploadedFile() reciptImage: Express.Multer.File, @Body() multipartBody: T) { // 지금은 단일 이미지만 처리한다. 추후에는 여러 영수증이미지를 받아서 처리할 수 있도록 하자.
        return this.reciptToSheetService.processingTransferredReceipt(reciptImage, multipartBody);
    }
}
