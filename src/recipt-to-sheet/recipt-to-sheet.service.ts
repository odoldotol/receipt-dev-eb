import { Injectable } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import credentials from '../../credential.json';

@Injectable()
export class ReciptToSheetService {

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
        client.annotateImage(request)
            .then(results => {
                console.log(results);
            })
            .catch(err => {
                console.error('annotateImage ERROR:', err);
            });
    }

    async uploadRecipt(reciptImage: Express.Multer.File) {
        
        // AWS | Firestore 에 이미지 업로드 (optional)
        // 구글 비젼 API 에 업로드
        this.annotateImage(reciptImage);
        /* 데이터 추출
            어디 영수증인지 알아내기 -> 이 부분 무시하고 홈플러스 라고 가정
            필요한 문자열들만 추출 (마트별 솔루션 개발 필요) -> 홈플러스 솔루션 적용
        */
        // 몽고디비에 저장하기 (optional)
        // Sheet 만들기
        // Sheet file 응답

        return;
    }
}