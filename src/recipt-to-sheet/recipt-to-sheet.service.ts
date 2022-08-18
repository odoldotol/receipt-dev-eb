import { Injectable } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import credentials from '../../credential.json';
import sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';

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

    async sendEmail(textArr, emailAddress) {

        sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'))

        let csvData = "0,1,2,3,4,5,6,7,8,9\n"
        const textData = textArr.reduce((acc, cur, idx) => {
            if (idx%9 === 0) {
                return acc +','+ cur + '\n'
            }
            else if (idx%9 === 1) {
                return acc + cur
            }
            else {
                return acc +','+ cur
            }
        })
        csvData += textData

        const attachment = Buffer.from(csvData, 'utf8').toString('base64');

        const msg = {
            to: emailAddress, // recipient
            from: 'service.lygo@gmail.com', // verified sender
            subject: 'Sending with SendGrid is Fun',
            text: 'and easy to do anywhere, even with Node.js',
            html: '<strong>and easy to do anywhere, even with Node.js</strong>',
            attachments: [
                {
                    content: attachment,
                    filename: "reciptImage.csv",
                    type: "application/csv",
                    disposition: "attachment"
                }
            ]
        }

        let result

        await sgMail
            .send(msg)
            .then(() => {
                // console.log('Email sent')
                result = 'Email sent'
            })
            .catch((error) => {
                console.error(error)
                result = error
            })

        return result
    }

    async processingTransferredReceipt(reciptImage, multipartBody) {

        // 영수증인지 확인하기 (optional, potentially essential)

        // AWS | Google Cloud 에 이미지 업로드 (optional, potentially necessary)

        // 구글 비젼 API 돌리기
        const annotateResult = await this.annotateImage(reciptImage);

        /* 데이터 추출
            항목객체 들을 최대한 정확히 만들어내면 된다.
            
            1. 어디 영수증인지 알아내기 -> 이 부분 무시하고 홈플러스 라고 가정
            
            2. 필요한 문자열들만 추출 (마트별 솔루션 개발 필요) -> 홈플러스 솔루션 적용
        */

        /* 몽고디비에 저장하기 (optional, potentially essential)
            항목 객체들이 담긴 배열과 그밖의 필요 데이터들을 도큐먼트로 저장하면된다.
        */

        // Sheet(csv) 만들기
        // 임시
        const textArr = annotateResult[0].textAnnotations.map(textObj => textObj.description);
        textArr.shift();

        // 이메일 보내기
        const email = await this.sendEmail(textArr, multipartBody.emailAddress);
        
        return {email,annotateResult}; // 앞의 모든 프로세스에 대한 결과나 상태를 알 수 있는 객체를 반환하기
    }
}