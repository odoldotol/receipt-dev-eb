import test from "./sametest";
import fullTextAnnotationPlusStudy from "./fullTextAnnotationPlusStudy";

const annotateResult = test.annotateResult
const textAnnotations = annotateResult[0].textAnnotations
const fullTextAnnotation = annotateResult[0].fullTextAnnotation

// console.log(fullTextAnnotationPlusStudy.pages[0].blocks[4].paragraphs[2].textStudy)

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

class idx {
    constructor(
        public pageIdx: number,
        public blockIdx?: number,
        public paragraphIdx?: number,
        public wordIdx?: number,
        public symbolIdx?: number,
    ) {}
}

/**
 * 정규표현식과 일치하는 요소 찾기 
 */
const getFulltextAnnoObjByReg = (pin) => {
    let result = []
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
// console.log({ // 페이지가 하나일 경우만 생각하자 일단
//     x: fullTextAnnotationPlusStudy.pages[0].width,
//     y: fullTextAnnotationPlusStudy.pages[0].height
// })
// console.log(textAnnotations[0].boundingPoly.vertices)

// 상품명 단가 수량 금액 찾아서 위치 잡기
// console.log(getFulltextAnnoObjByReg(/상품명/)[0][1].boundingBox.vertices)
// console.log(getFulltextAnnoObjByReg(/단가/)[0][1].boundingBox.vertices)
// console.log(getFulltextAnnoObjByReg(/수량/)[0][1].boundingBox.vertices)
// console.log(getFulltextAnnoObjByReg(/금액/)[0][1].boundingBox.vertices)
// console.log(getFulltextAnnoObjByReg(/금액/)[1][1].boundingBox.vertices)

// console.log(getFulltextAnnoObjByReg(/구매금액/))
// console.log(getFulltextAnnoObjByReg(/표시 상품은 부가세 면세품목입니다/)[0][1].boundingBox.vertices)


// 어찌어찌 y 143 초과 493 | 394 미만인 것들을 찾으면 된다고 결론 났다고 치자
/**
 * 완전 속해있으면 반환하고 걸쳐있으면 탐구하고 아예 안걸쳐있으면 패스하는 탐색 <주의> 페이지 1개인 경우만 고려되었음
 */
const getFulltextAnnoObjByRange = (rangeX/*[overX, underX]*/, rangeY/*[overY, underY]*/, includeSymbols: boolean, continueOptions?/*{includeWords:boo, word:0|1, includeSymbols:boo, symbol:0|1}*/) => {
    let result = []
    /**
     * 완전 속해있으면 true, 완전 분리되어있으면 false, 걸쳐있으면 "continue" 반환
     */
    const compareVertices = (vertices) => {
        const verticesX = []
        const verticesY = []
        vertices.forEach((vertex) => {
            verticesX.push(vertex.x)
            verticesY.push(vertex.y)
        })
        const maxX = Math.max(...verticesX)
        const minX = Math.min(...verticesX)
        const maxY = Math.max(...verticesY)
        const minY = Math.min(...verticesY)

        return [compareRange(minX, maxX, rangeX), compareRange(minY, maxY, rangeY)]

        function compareRange(min, max, range) {
            if ( // 완전 속해있음
                min > range[0] && max < range[1]
            ) {
                return true
            }
            else if ( // 완전 분리되어있음
                (min <= range[0] && max <= range[0]) || (max >= range[1] && min >= range[1])
            ) {
                return false
            }
            else {
                return "continue"
            }
        }

        // if ( // 완전 속해있음
        //     (minY > rangeY[0] && maxY < rangeY[1]) &&
        //     (minX > rangeX[0] && maxX < rangeX[1])
        // ) {
        //     return true
        // }
        // else if ( // 완전 분리되어있음
        //     ((minY <= rangeY[0] && maxY <= rangeY[0]) || (maxY >= rangeY[1] && minY >= rangeY[1])) ||
        //     ((minX <= rangeX[0] && maxX <= rangeX[0]) || (maxX >= rangeX[1] && minX >= rangeX[1]))
        // ) {
        //     return false
        // }
        // else {
        //     return "continue"
        // }
    };

    fullTextAnnotationPlusStudy.pages[0].blocks.forEach((block, blockIndex) => {
        const compare = compareVertices(block.boundingBox.vertices)
        if (compare[0] === true && compare[1] === true) {
            result.push([new idx(0, blockIndex), block])
        }
        else if (
            (compare[0] === "continue" || compare[1] === "continue") &&
            (compare[0] !== false && compare[1] !== false)
        ) {
            block.paragraphs.forEach((paragraph, paragraphIndex) => {
                const compare = compareVertices(paragraph.boundingBox.vertices)
                if (compare[0] === true && compare[1] === true) {
                    result.push([new idx(0, blockIndex, paragraphIndex), paragraph])
                }
                else if (
                    (compare[0] === "continue" || compare[1] === "continue") &&
                    (compare[0] !== false && compare[1] !== false)
                ) {
                    paragraph.words.forEach((word, wordIndex) => {
                        const compare = compareVertices(word.boundingBox.vertices)
                        if (compare[0] === true && compare[1] === true) {
                            result.push([new idx(0, blockIndex, paragraphIndex, wordIndex), word])
                        }
                        else if (
                            (compare[0] === "continue" || compare[1] === "continue") &&
                            (compare[0] !== false && compare[1] !== false)
                        ) {
                            if (includeSymbols) {
                                word.symbols.forEach((symbol, symbolIndex) => {
                                    const compare = compareVertices(symbol.boundingBox.vertices)
                                    if (compare[0] === true && compare[1] === true) {
                                        result.push([new idx(0, blockIndex, paragraphIndex, wordIndex, symbolIndex), symbol])
                                    }
                                    else if (
                                        continueOptions.includeSymbols &&
                                        (compare[0] === "continue" || compare[1] === "continue") &&
                                        (compare[0] !== false && compare[1] !== false)
                                    ) {
                                        result.push([new idx(0, blockIndex, paragraphIndex, wordIndex, symbolIndex), symbol, "continue"])
                                    }
                                })
                            }
                            else if (continueOptions && continueOptions.includeWords) {
                                if (continueOptions.word !== undefined) {
                                    if (compare[continueOptions.word] === true) {
                                        result.push([new idx(0, blockIndex, paragraphIndex, wordIndex), word, "continue"])
                                    }
                                }
                                else {
                                    result.push([new idx(0, blockIndex, paragraphIndex, wordIndex), word, "continue"])
                                }
                            }
                        }
                    })
                }
            })
        }
    })
    return result
}

// 상품명
const productNameGroup = sortGroupAscByY(
    getFulltextAnnoObjByRange([0,242], [143,395], false)
);

// 단가
const unitPriceGroup = sortGroupAscByY(
    getFulltextAnnoObjByRange([242,271], [143,395], false, {includeWords: true, word: 1})
);

// 수량
const quantityGroup = sortGroupAscByY(
    getFulltextAnnoObjByRange([271,295], [143,395], false)
);

// 금액
const amountGroup = sortGroupAscByY(
    getFulltextAnnoObjByRange([295,333], [143,395], false, {includeWords: true, word: 1})
);

/**
 * 그룹을 word 나 paragraph 단위로 만들어놔야한다고 생각해봤다.
 * 하지만 어차피 그 경우에도 문제는 있다.
 * word 로 하면 뛰어쓰기를 넘길테고
 * paragraph 로 하면 여러줄을 하나의 덩어리로 할 수도 있다.
 * 어차피 블록으로 찾아진것과 같은 문제는 존재한다. 오히려 더 복잡해질 수 있다.
 */

// y축에대해 내림차순으로 정령한 상태에서 각 항목의 위치정보를 쓰지말고 갯수 비교해서 맞으면 순서대로 매칭시켜주면 될거같다!
// console.log(productNameGroup.length)
// console.log(unitPriceGroup.length)
// console.log(quantityGroup.length)
// console.log(amountGroup.length)
/**
 * 갯수비교
 * 행사할인 : 단가 -1, 수량 -1
 * 쿠폰할인 : 수량 -1
 * 사실 어차피 text 만 뺴내서 배열로 만들면 매우 편하다. 그러니 갯수를 비교하면서 새로운 배열을 만들어서 갯수체크통과여부와 함께 반환시켜버리자.
 */
function getTextArraysFromGroups(productNameGroup, unitPriceGroup, quantityGroup, amountGroup) {
    // /\n./ 이 있으면 +1 해서 갯수 찾기
    const reg = /\n./
    // productNameGroup 순회하며 갯수파악. 동시에 행사할인|쿠폰할인 발견하면 체킹하기
}


console.log(productNameGroup)


function sortGroupAscByY(group) {
    return group.sort((a,b) => {
        const aVerticesY = a[1].boundingBox.vertices.map((v) => v.y)
        const bVerticesY = b[1].boundingBox.vertices.map((v) => v.y)
        return Math.min(...aVerticesY) - Math.min(...bVerticesY)
    })
}