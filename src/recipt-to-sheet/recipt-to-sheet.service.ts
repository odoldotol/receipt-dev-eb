import { BadRequestException, Injectable } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import credentials from '../../credential.json';
import sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';
import xlsx from 'xlsx'
import googleVisionAnnoInspectorPipe from '../googleVisionAnnoPipe/inspector.V0.0.1';
import getReceiptObject from '../receiptObj/get.V0.1.1';
import { MultipartBodyDto } from './dto/multipartBody.dto';
import { writeFile } from 'fs';

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
    };

    createAttachments(receiptObject, sheetFormat) {
        let attachment
        const date = receiptObject.readFromReceipt.date
        if (sheetFormat === 'csv') {
            // let csvData = "0,1,2,3,4,5,6,7,8,9\n"
            // textArr[0] = '"'+textArr[0]+'"'
            // const textData = textArr.reduce((acc, cur, idx) => {
            //     if (idx%10 === 9) {
            //         return acc +','+ '"' + cur+ '"' + '\n'
            //     }
            //     else if (idx!==0 && idx%10 === 0) {
            //         return acc + '"' + cur + '"'
            //     }
            //     else {
            //         return acc +','+ '"' + cur + '"'
            //     }
            // })
            // csvData += textData
            // attachment = Buffer.from(csvData, 'utf8').toString('base64');
        }
        else if (sheetFormat === 'xlsx') { // xlsx

            const rowObjArr = receiptObject.itemArray.map((item, idx) => {
                return {
                    'no': idx+1,
                    '상품명': item.readFromReceipt.productName,
                    '단가': item.readFromReceipt.unitPrice,
                    '수량': item.readFromReceipt.quantity,
                    '금액': item.readFromReceipt.amount,
                    '할인총금액': item.itemDiscountAmount,
                    '구매금액': item.purchaseAmount,
                    '카테고리': item.category,
                    '부가세면세': item.readFromReceipt.taxExemption,
                }
            });

            // 할인 내용 추가
            receiptObject.itemArray.forEach((item, itemIdx) => {
                item.readFromReceipt.discountArray.forEach((discount, discountIdx) => {
                    rowObjArr[itemIdx][`할인${discountIdx+1}`] = discount.name
                    rowObjArr[itemIdx][`할인${discountIdx+1}코드`] = discount.code
                    rowObjArr[itemIdx][`할인${discountIdx+1}금액`] = discount.amount
                })
            })

            const wb = xlsx.utils.book_new()
            const ws = xlsx.utils.json_to_sheet(rowObjArr)

            xlsx.utils.book_append_sheet(wb, ws, `${date.toLocaleDateString('ko-KR', {timeZone: 'Asia/Seoul'})}-Homeplus`) // 결제일, 마트
            attachment = xlsx.write(wb, {type: 'base64', bookType: 'xlsx'})
        };

        return [{
            content: attachment,
            filename: `${date.toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'})}-Homeplus.` + sheetFormat, // 마트, 시트포멧 // 복수의 이미지를 처리하게되면 신청일+???.xlsx ??
            type: "application/" + sheetFormat,
            disposition: "attachment"
        }]
    };

    async sendEmail(attachments, receiptObject) {
        const date = receiptObject.readFromReceipt.date
        sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'))
        const msg = {
            to: receiptObject.provider.emailAddress, // recipient // 나중엔 output 에서
            from: 'service.lygo@gmail.com', // verified sender
            subject: `${date.getFullYear()}년 ${date.getMonth()+1}월 ${date.getDate()}일 결제하신 홈플러스 영수증의 엑셀파일입니다.`, // 마트, 시트포멧
            // text: 'www.recipto.com',
            html: '<strong>www.receipto.com</strong>',
            attachments
        }
        let result
        await sgMail
            .send(msg)
            .then((res) => {
                // console.log('Email sent')
                result = {'Email sent': res}
            })
            .catch((error) => {
                console.error('Email sent ERROR: ', error)
                result = {"Email sent ERROR": error}
            })
        return result
    };

    async processingTransferredReceipt(reciptImage: Express.Multer.File, multipartBody: MultipartBodyDto) {

        // 영수증인지 확인하기 (optional, potentially essential)
        // 생각해보니, 거꾸로였다!! 잘 만들어진 어떤 특정 영수증 솔루션에 정상 해독되면 그 특정 영수증이라고 판단하는게 더 나을수도있겠네!?
        // 우선은 영수증 이미지를 받을때 어떤 영수증인지 정보가 오게해야하고, 그게 안오거나 불확실하는걸 생각해서 저리 순서.과정을 짜자

        // AWS | Google Cloud 에 이미지 업로드 (optional, potentially necessary) (구글 클라우드 사용하면 비젼돌리는것과 합쳐서 한방에 처리가능하지 않을까?)

        // 구글 비젼 API 돌리기
        const annotateResult = await this.annotateImage(reciptImage);

        // 데이터 추출하고 영수증객체 만들기
            /*
            1. 어디 영수증인지 알아내기 -> 일단, 이 부분 무시하고 홈플러스 라고 가정
            2. 홈플러스 솔루션으로 text 추출하여 영수증갹체 만들기
            */
        const receiptObject = getReceiptObject(
            googleVisionAnnoInspectorPipe(annotateResult),
            multipartBody
        );

        // Sheet 만들기 (csv | xlsx) -> attachments 만들기
        const attachments = this.createAttachments(receiptObject, multipartBody.sheetFormat);
        
        // 이메일 보내기
        const email = await this.sendEmail(attachments, receiptObject);
        
        /* 몽고디비에 저장하기 (optional, potentially essential)
            항목 객체들이 담긴 배열과 그밖의 필요 데이터들을 도큐먼트로 저장하면된다.
            email 전송 성공여부도 저장된다.
        */

        return {email,receiptObject};
    };

    async sendGoogleVisionAnnotateResultToLabs(reciptImage: Express.Multer.File, multipartBody: MultipartBodyDto) {
        
        const {receiptStyle, labsReceiptNumber} = multipartBody;
        if (!receiptStyle || !labsReceiptNumber) {
            throw new BadRequestException('receiptStyle or labsReceiptNumber is not available')
        }
        const annotateResult = await this.annotateImage(reciptImage);

        let data = "export = " + JSON.stringify(annotateResult, null, 4);
        writeFile(`src/googleVisionAnnoLab/annotateResult/${receiptStyle}/${labsReceiptNumber}.ts`, data, () => { console.log("WRITED: an annotateResult file"); });

        data = "export = " + JSON.stringify(multipartBody, null, 4);
        writeFile(`src/googleVisionAnnoLab/annotateResult/${receiptStyle}/${labsReceiptNumber}-body.ts`, data, () => { console.log("WRITED: a multipartBody file"); });
    };
};
