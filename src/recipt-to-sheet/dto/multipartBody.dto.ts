import { Equals, IsEmail, IsNotEmpty } from "class-validator";

export class MultipartBodyDto {
    
    @IsEmail()
    @IsNotEmpty()
    readonly emailAddress: string;
    
    @Equals("xlsx"||"csv")
    readonly sheetFormat: string;

};
