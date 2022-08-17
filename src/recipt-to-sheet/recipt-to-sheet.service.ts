import { Injectable } from '@nestjs/common';

@Injectable()
export class ReciptToSheetService {

    async uploadRecipt(reciptImage: Express.Multer.File) {

        // AWS 에 이미지 업로드 (optional)
        // 구글 비젼 API 에 업로드
        /* 데이터 추출
            어디 영수증인지 알아내기 -> 이 부분 무시하고 홈플러스 라고 가정
            필요한 문자열들만 추출 (마트별 솔루션 개발 필요) -> 홈플러스 솔루션 적용
        */
        // 몽고디비에 저장하기 (optional)
        // Sheet 만들기
        // Sheet file 응답

        console.log(reciptImage);
        return;
    }
}