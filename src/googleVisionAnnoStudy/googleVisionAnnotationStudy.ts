import test from "./sametest";
import { writeFile } from "fs";

const annotateResult = test.annotateResult
const textAnnotations = annotateResult[0].textAnnotations
const fullTextAnnotation = annotateResult[0].fullTextAnnotation

// textAnnotations 예외 찾기 // 예외 없으면 '안전지대'
const t1 = () => {
    let result = []
    textAnnotations.forEach((textAnno, idx) => {
        if (
            textAnno.locations.length !== 0 ||
            textAnno.properties.length !== 0 ||
            textAnno.mid !== "" ||
            (textAnno.locale !== "" && idx !== 0) ||
            textAnno.score !== 0 ||
            textAnno.confidence !== 0 ||
            textAnno.topicality !== 0 ||
            textAnno.boundingPoly.normalizedVertices.length !== 0
        ) {
            result.push({textAnno, idx})
        }
    })
    if (result.length === 0) {
        console.log("textAnnotations 예외 없음")
    }
    else {
        console.log("textAnnotations 예외 발견")
        console.log(result)
    }
    // return result
};

const t2 = () => {
    let result = [];
    fullTextAnnotation.pages.forEach((page, pageIdx) => {
        if (page.property.detectedBreak !== null) {
            const exceptionPage = page
            delete exceptionPage.blocks
            result.push({exceptionPage, pageIdx})
            console.log(`page 예외 발견, ${pageIdx}`)
        };
        let pageText = ""
        page.blocks.forEach((block, blockIdx) => {
            if (
                block.property !== null ||
                block.boundingBox.normalizedVertices.length !== 0 ||
                block.blockType !== "TEXT"
            ) {
                const exceptionBlock = block
                delete exceptionBlock.paragraphs
                result.push({exceptionBlock, pageIdx, blockIdx})
                console.log(`block 예외 발견, ${pageIdx}, ${blockIdx}`)
            };
            let blockText = ""
            block.paragraphs.forEach((paragraph, paragraphIdx) => {
                if (
                    paragraph.property !== null ||
                    paragraph.boundingBox.normalizedVertices.length !== 0
                ) {
                    const exceptionParagraph = paragraph
                    delete exceptionParagraph.words
                    result.push({exceptionParagraph, pageIdx, blockIdx, paragraphIdx})
                    console.log(`paragraph 예외 발견, ${pageIdx}, ${blockIdx}, ${paragraphIdx}`)
                };
                let paragraphText = ""
                paragraph.words.forEach((word, wordIdx) => {
                    if (word.property === null) {} // 숫자일것이다
                    else {
                        if (
                            word.property.detectedLanguages[0].confidence !== 1 || // 배열순회하도록수정필요
                            word.property.detectedBreak !== null ||
                            word.boundingBox.normalizedVertices.length !== 0
                        ) {
                            const exceptionWord = word
                            delete exceptionWord.symbols
                            result.push({exceptionWord, pageIdx, blockIdx, paragraphIdx, wordIdx})
                            console.log(`word 예외 발견, ${pageIdx}, ${blockIdx}, ${paragraphIdx}, ${wordIdx}`)
                        };
                    };
                    let wordText = ""
                    word.symbols.forEach((symbol, symbolIdx) => {
                        if (symbol.property !== null) {
                            if (
                                (
                                    symbol.property.detectedBreak.type !== "SPACE" &&
                                    symbol.property.detectedBreak.type !== "EOL_SURE_SPACE" &&
                                    symbol.property.detectedBreak.type !== "LINE_BREAK"
                                ) ||
                                symbol.property.detectedLanguages.length !== 0 ||
                                symbol.property.detectedBreak.isPrefix !== false
                            ) {
                                const exceptionSymbol = symbol
                                result.push({exceptionSymbol, pageIdx, blockIdx, paragraphIdx, wordIdx, symbolIdx})
                                console.log(`symbol 예외 발견, ${pageIdx}, ${blockIdx}, ${paragraphIdx}, ${wordIdx}, ${symbolIdx}`)
                            };
                        };
                        wordText += symbol.text
                        if (symbol.property !== null) {
                            if (symbol.property.detectedBreak.type === "SPACE") {
                                wordText += " "
                                // console.log(wordText)
                            }
                            else if (symbol.property.detectedBreak.type === "EOL_SURE_SPACE") {
                                wordText += "\n"
                                // console.log(wordText)
                            }
                            else if (symbol.property.detectedBreak.type === "LINE_BREAK") {
                                wordText += "\n"
                                // console.log(wordText)
                            }
                        }
                    });
                    // fullTextAnnotationPlusStudy.pages[pageIdx].blocks[blockIdx].paragraphs[paragraphIdx].words[wordIdx].study = {}
                    // fullTextAnnotationPlusStudy.pages[pageIdx].blocks[blockIdx].paragraphs[paragraphIdx].words[wordIdx].study.text = wordText
                    fullTextAnnotationPlusStudy.pages[pageIdx].blocks[blockIdx].paragraphs[paragraphIdx].words[wordIdx].textStudy = wordText
                    paragraphText += wordText
                });
                // fullTextAnnotationPlusStudy.pages[pageIdx].blocks[blockIdx].paragraphs[paragraphIdx].study = {}
                // fullTextAnnotationPlusStudy.pages[pageIdx].blocks[blockIdx].paragraphs[paragraphIdx].study.text = paragraphText
                fullTextAnnotationPlusStudy.pages[pageIdx].blocks[blockIdx].paragraphs[paragraphIdx].textStudy = paragraphText
                blockText += paragraphText
            });
            // fullTextAnnotationPlusStudy.pages[pageIdx].blocks[blockIdx].study = {}
            // fullTextAnnotationPlusStudy.pages[pageIdx].blocks[blockIdx].study.text = blockText
            fullTextAnnotationPlusStudy.pages[pageIdx].blocks[blockIdx].textStudy = blockText
            pageText += blockText
        });
        // fullTextAnnotationPlusStudy.pages[pageIdx].study = {}
        // fullTextAnnotationPlusStudy.pages[pageIdx].study.text = pageText
        fullTextAnnotationPlusStudy.pages[pageIdx].textStudy = pageText
    });
    if (result.length === 0) {
        console.log("fullTextAnnotation 예외 없음")
    } else {
        console.log("fullTextAnnotation 예외 발견")
        console.log(result)
    }
    // return result
};


// => fullTextAnnotation 해석
//// pages, blocks, paragraphs, words, symbols 각각의 text 내용 합쳐서 보기
let fullTextAnnotationPlusStudy: any = fullTextAnnotation // 타입 any 주지말고 전부 [""] 이런방식으로 수정해도 되긴 하는데...






t1();
t2();

// console.log(fullTextAnnotationPlusStudy.pages[0].blocks[2].study.text)

// let data = "export = "+JSON.stringify(fullTextAnnotationPlusStudy, ['pages', 'blocks', 'paragraphs', 'words', 'symbols', 'study', 'text', 'textStudy'], 4);
let data = "export = " + JSON.stringify(fullTextAnnotationPlusStudy, null, 4);
writeFile("src/googleVisionAnnoStudy/fullTextAnnotationPlusStudy.ts", data, () => { console.log("WRITED: fullTextAnnotationPlusStudy.ts"); });