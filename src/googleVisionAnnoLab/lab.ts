import getReceiptObject from '../receiptObj/get.V0.0.1';
import googleVisionAnnoInspectorPipe from '../googleVisionAnnoPipe/inspector.V0.0.1';
import { readFileSync } from 'fs';

/* ------------------------------------------------------------------ */
const receiptStyle = "homeplus"; //
const receiptNumber = 1; //
/* ------------------------------------------------------------------ */

const annotateResult = JSON.parse(readFileSync(`src/googleVisionAnnoLab/annotateResult/${receiptStyle}/${receiptNumber}.ts`, 'utf8').slice(9));

const multipartBody = JSON.parse(readFileSync(`src/googleVisionAnnoLab/annotateResult/${receiptStyle}/${receiptNumber}-body.ts`, 'utf8').slice(9));

const receiptObject = getReceiptObject(
    googleVisionAnnoInspectorPipe(annotateResult),
    multipartBody
);
console.log(receiptObject);
