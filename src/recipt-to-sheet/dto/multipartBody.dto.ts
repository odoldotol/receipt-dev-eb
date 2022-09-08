import { Equals, IsEmail, IsIn, IsNotEmpty } from "class-validator";

export class MultipartBodyDto {
    
    @IsEmail()
    @IsNotEmpty()
    readonly emailAddress: string;
    
    @IsIn(["xlsx","csv"])
    readonly sheetFormat: string;

};
