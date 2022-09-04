import test from "./sametest";
import fullTextAnnotationPlusStudy from "./fullTextAnnotationPlusStudy";

const annotateResult = test.annotateResult
const textAnnotations = annotateResult[0].textAnnotations
const fullTextAnnotation = annotateResult[0].fullTextAnnotation



// 1. 고정 text 들 찾아서 상대적 위치로 찾는 방법론

// 2. 필요한 텍스트들의 특징으로 찾기 (그 요소 자체의 프로퍼티등 특징이나 정규표현식? 등등 그 자채가 가진 특정)

// 3. 주변 텍스트나 요소들의 특징으로 찾기

/**
 * '상품명'보다 아래있음
 * 뛰어쓰이없이 이어져있음
 * 01 02 03 등 숫자들 위에 나옴
 * 표시상품은 부바세 면세품목입니다 위에있음
 * 각 단가들 왼쪽에 있음
 * 줄바꿈이나 긴공백으로 끝남
 */


/**
 * 정규표현식과 일치하는 요소 찾기 
 */
const getFulltextAnnoObjByReg = (pin) => {
    let result = []
    class idx {
        constructor(
            public pageIdx: number,
            public blockIdx?: number,
            public paragraphIdx?: number,
            public wordIdx?: number,
            public symbolIdx?: number,
        ) {}
    }
    if (pin.test(fullTextAnnotationPlusStudy.text)) {
        let isInPage = false
        fullTextAnnotationPlusStudy.pages.forEach((page, pageIndex) => {
            if (pin.test(page.textStudy)) {
                isInPage = true
                let isInBlock = false
                page.blocks.forEach((block, blockIndex) => {
                    if (pin.test(block.textStudy)) {
                        isInBlock = true
                        let isInParagraph = false
                        block.paragraphs.forEach((paragraph, paragraphIndex) => {
                            if (pin.test(paragraph.textStudy)) {
                                isInParagraph = true
                                let isInWord = false
                                paragraph.words.forEach((word, wordIndex) => {
                                    if (pin.test(word.textStudy)) {
                                        isInWord = true
                                        let isInSymbol = false
                                        word.symbols.forEach((symbol, symbolIndex) => {
                                            if (pin.test(symbol.text)) {
                                                isInSymbol = true
                                                result.push([new idx(pageIndex, blockIndex, paragraphIndex, wordIndex, symbolIndex), symbol])
                                            }
                                        })
                                        // 모든 심볼에서 없으면?
                                        if (!isInSymbol) {
                                            result.push([new idx(pageIndex, blockIndex, paragraphIndex, wordIndex), word])
                                        }
                                    }
                                })
                                // 모든 단어에서 없으면?
                                if (!isInWord) {
                                    result.push([new idx(pageIndex, blockIndex, paragraphIndex), paragraph])
                                }
                            }
                        })
                        // 모든 구절에서 없으면?
                        if (!isInParagraph) {
                            result.push([new idx(pageIndex, blockIndex), block])
                        }
                    }
                })
                // 모든 블록에서 없으면?
                if (!isInBlock) {
                    result.push([new idx(pageIndex), page])
                }
            }
        })
        // 모든 페이지에서 없으면?
        if (!isInPage) {
            return []
        }
    }
    else {
        return null
    }
    return result
}


// 상품명 단가 수량 금액 찾아서 위치 잡기

// 단 하나인가?
// 하나씩이면 싹 위치상대비교해서 일자로 맞춰지는지 대충 보기
// 여러개면 일단 위치상대비교하고 일자로 마춰지는걸로 골라내기

// 전체 페이지 크기안에 텍스트가 보이는 부분을 비교해서 대략적 영수증 위치방향상태 확인하기
console.log({ // 페이지가 하나일 경우만 생각하자 일단
    x: fullTextAnnotationPlusStudy.pages[0].width,
    y: fullTextAnnotationPlusStudy.pages[0].height
})
console.log(textAnnotations[0].boundingPoly.vertices)

// 상품명 단가 수량 금액 찾아서 위치 잡기
console.log(getFulltextAnnoObjByReg(/상품명/)[0][1].boundingBox.vertices)
console.log(getFulltextAnnoObjByReg(/단가/)[0][1].boundingBox.vertices)
console.log(getFulltextAnnoObjByReg(/수량/)[0][1].boundingBox.vertices)
console.log(getFulltextAnnoObjByReg(/금액/)[0][1].boundingBox.vertices)
console.log(getFulltextAnnoObjByReg(/금액/)[1][1].boundingBox.vertices)

// console.log(fullTextAnnotationPlusStudy.pages[0].blocks[4].paragraphs[2].textStudy)
