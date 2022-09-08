import annotateResult from './annotateResult'
import multipartBody from './multipartBody'
import getReceiptObject from '../receiptObj/get.V0.0.1';
import googleVisionAnnoInspectorPipe from '../googleVisionAnnoPipe/inspector.V0.0.1';


const receiptObject = getReceiptObject(
    googleVisionAnnoInspectorPipe(annotateResult),
    multipartBody
);

console.log(receiptObject);