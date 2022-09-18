import getReceiptObject from '../receiptObj/get.V0.1.1';
import googleVisionAnnoInspectorPipe from '../googleVisionAnnoPipe/inspector.V0.0.1';
import { readFileSync, writeFile } from 'fs';

/* ------------------------------------------------------------------ */
const receiptStyle = "homeplus"; //
const receiptNumber = 1; //
/* ------------------------------------------------------------------ */

const annotateResult = JSON.parse(readFileSync(`src/googleVisionAnnoLab/annotateResult/${receiptStyle}/${receiptNumber}.ts`, 'utf8').slice(9));

const multipartBody = JSON.parse(readFileSync(`src/googleVisionAnnoLab/annotateResult/${receiptStyle}/${receiptNumber}-body.ts`, 'utf8').slice(9));

const pipedAnnotateResult = googleVisionAnnoInspectorPipe(annotateResult);

// // fullTextAnnotationPlusStudy 파일 쓰기
// const data = "export = " + JSON.stringify(pipedAnnotateResult.fullTextAnnotationPlusStudy, null, 4);
// writeFile(`src/googleVisionAnnoLab/fullTextAnnotationPlusStudy/${receiptStyle}/${receiptNumber}.ts`, data, () => { console.log("WRITED: a fullTextAnnotationPlusStudy file", receiptNumber); });


const receiptObject = getReceiptObject(pipedAnnotateResult, multipartBody);

console.log(receiptObject);
