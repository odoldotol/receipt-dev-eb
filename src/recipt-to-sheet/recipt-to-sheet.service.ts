import { Injectable } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import credentials from '../../credential.json';
import sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';
import xlsx from 'xlsx'

@Injectable()
export class ReciptToSheetService {

    constructor(
        private readonly configService: ConfigService,
    ) {}

    async annotateImage(image: Express.Multer.File) {
        const client = new ImageAnnotatorClient({credentials});
        const request = {
            "image": {
                "content": image.buffer.toString('base64')
            },
            "features": [
                {"type": "TEXT_DETECTION"},
                {"type": "DOCUMENT_TEXT_DETECTION"},
                {"type": "CROP_HINTS"},
                // {"type": "LOGO_DETECTION"},
            ]
        };
        let result
        await client.annotateImage(request)
            .then(results => {
                // console.log(results);
                result = results
            })
            .catch(err => {
                console.error('annotateImage ERROR:', err);
                result = err
            });
        return result
    }

    createAttachments(textArr, sheetFormat) {
        let attachment
        if (sheetFormat === 'csv') {
            let csvData = "0,1,2,3,4,5,6,7,8,9\n"
            textArr[0] = '"'+textArr[0]+'"'
            const textData = textArr.reduce((acc, cur, idx) => {
                if (idx%10 === 9) {
                    return acc +','+ '"' + cur+ '"' + '\n'
                }
                else if (idx!==0 && idx%10 === 0) {
                    return acc + '"' + cur + '"'
                }
                else {
                    return acc +','+ '"' + cur + '"'
                }
            })
            csvData += textData
            attachment = Buffer.from(csvData, 'utf8').toString('base64');
        }
        else { // xlsx
            // let arr = [ 임시 정렬포멧 예
            //     {0: textArr[0], 1:textArr[1], 2:textArr[2], 3:textArr[3], 4:textArr[4], 5:textArr[5], 6:textArr[6], 7:textArr[7], 8:textArr[8], 9:textArr[9]},
            //     {0: textArr[10], 1:textArr[11], 2:textArr[12], 3:textArr[13], 4:textArr[14], 5:textArr[15], 6:textArr[16], 7:textArr[17], 8:textArr[18], 9:textArr[19]},
            //     {0: textArr[20], 1:textArr[21], 2:textArr[22], 3:textArr[23], 4:textArr[24], 5:textArr[25], 6:textArr[26], 7:textArr[27], 8:textArr[28], 9:textArr[29]},
            // ]
            let tempArr = Array.from({length: Math.floor(textArr.length/10)+1}, () => {return {}})
            textArr.forEach((text, idx) => {
                tempArr[Math.floor(idx/10)][idx%10] = text
            })
            const wb = xlsx.utils.book_new()
            const ws = xlsx.utils.json_to_sheet(tempArr)
            xlsx.utils.book_append_sheet(wb, ws, "somewhen-someMart") // 결제일, 마트
            attachment = xlsx.write(wb, {type: 'base64', bookType: 'xlsx'})
        }
        return [{
            content: attachment,
            filename: "somewhen-someMart." + sheetFormat, // 결제일, 마트, 시트포멧 // 복수의 이미지를 처리하게되면 신청일+???.xlsx ??
            type: "application/" + sheetFormat,
            disposition: "attachment"
        }]
    }

    async sendEmail(attachments, emailAddress) {
        sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'))
        const msg = {
            to: emailAddress, // recipient
            from: 'service.lygo@gmail.com', // verified sender
            subject: '00년 00월 00일 결제하신 홈플러스 영수증의 엑셀파일입니다.', // 결제일, 마트, 시트포멧
            // text: 'www.recipto.com',
            html: '<strong>www.recipto.com</strong>',
            attachments
        }
        let result
        await sgMail
            .send(msg)
            .then(() => {
                // console.log('Email sent')
                result = 'Email sent'
            })
            .catch((error) => {
                console.error('Email sent ERROR: ', error)
                result = "Email sent ERROR"
            })
        return result
    }

    async processingTransferredReceipt(reciptImage: Express.Multer.File, multipartBody) {

        // 영수증인지 확인하기 (optional, potentially essential)

        // AWS | Google Cloud 에 이미지 업로드 (optional, potentially necessary) (구글 클라우드 사용하면 비젼돌리는것과 합쳐서 한방에 처리가능하지 않을까?)

        // 구글 비젼 API 돌리기
        const annotateResult = await this.annotateImage(reciptImage);

        // 데이터 추출
            /*
            항목객체 들을 최대한 정확히 만들어내면 된다.
            
            1. 어디 영수증인지 알아내기 -> 이 부분 무시하고 홈플러스 라고 가정
            
            2. 필요한 문자열들만 추출 (마트별 솔루션 개발 필요) -> 홈플러스 솔루션 적용
            */
            // test ----------------
        const textArr = annotateResult[0].textAnnotations.map(textObj => textObj.description);
        textArr.shift();
            // test ----------------

        /* 몽고디비에 저장하기 (optional, potentially essential)
            항목 객체들이 담긴 배열과 그밖의 필요 데이터들을 도큐먼트로 저장하면된다.
        */

        // Sheet 만들기 (csv | xlsx) -> attachments 만들기
        const attachments = this.createAttachments(textArr, multipartBody.sheetFormat)

        // 이메일 보내기
        const email = await this.sendEmail(attachments, multipartBody.emailAddress);
        
        return {email,annotateResult}; // 앞의 모든 프로세스에 대한 결과나 상태를 알 수 있는 객체를 반환하기
    }
}