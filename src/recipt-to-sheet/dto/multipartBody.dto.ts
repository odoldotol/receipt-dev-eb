import { IsEmail, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class MultipartBodyDto {
    
    @IsEmail()
    @IsNotEmpty()
    readonly emailAddress: string;
    
    @IsIn(["xlsx","csv"])
    readonly sheetFormat: string;

    @IsOptional()
    @IsIn(['homeplus'])
    readonly receiptStyle?: string;

    @IsOptional()
    @IsString()
    readonly labsReceiptNumber?: string;

    @IsOptional()
    readonly password: string; // 임시
};
