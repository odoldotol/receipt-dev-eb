import test from "./sametest";

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
    return result
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
                    if (!word.symbols) {
                        result.push({exceptionWord: word, pageIdx, blockIdx, paragraphIdx, wordIdx})
                        console.log(`word 예외 발견, ${pageIdx}, ${blockIdx}, ${paragraphIdx}, ${wordIdx}`)
                    }
                    else {
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
                        });
                    };
                });
            });
        });
    });
    if (result.length === 0) {
        console.log("fullTextAnnotation 예외 없음")
    }
    else {
        console.log(result)
    }
    // return result
};


// => property 탐색하는 방법 세우기
// => fullTextAnnotation 해석
//// pages, blocks, paragraphs, words, symbols 각각의 text 내용 합쳐서 보기
let fullTextAnnoStudy = {}
let fullTextAnnotationPlusStudy = fullTextAnnotation
const t3 = () => {

}















if (t1().length !== 0) {
    console.log("textAnnotations 예외 발견")
    console.log(t1())
}
else {
    console.log("textAnnotations 예외 없음")
}

t2()