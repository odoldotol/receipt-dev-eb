import getReceiptObject from '../receiptObj/get.V0.0.1';
import googleVisionAnnoInspectorPipe from '../googleVisionAnnoPipe/inspector.V0.0.1';
import { readFileSync, writeFile } from 'fs';

/* ------------------------------------------------------------------ */
const receiptStyle = "homeplus"; //
const receiptNumber = 4; //
/* ------------------------------------------------------------------ */

const annotateResult = JSON.parse(readFileSync(`src/googleVisionAnnoLab/annotateResult/${receiptStyle}/${receiptNumber}.ts`, 'utf8').slice(9));

const multipartBody = JSON.parse(readFileSync(`src/googleVisionAnnoLab/annotateResult/${receiptStyle}/${receiptNumber}-body.ts`, 'utf8').slice(9));

const receiptObject = getReceiptObject(
    googleVisionAnnoInspectorPipe(annotateResult),
    multipartBody
);

const data = "export = " + JSON.stringify(receiptObject, null, 4);
writeFile(`src/googleVisionAnnoLab/expectReceipt/${receiptStyle}/${receiptNumber}.ts`, data, () => { console.log("WRITED: an expectReceipt file"); });
