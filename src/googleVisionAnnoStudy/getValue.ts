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

class idx { // 해석, 디버그 편의성을 위한놈
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

/**
 * 영수증 위치해석 & 읽을 text 위치 결정
 * Ver 0.0.1
 * 
 * <조건>
 * 영수증은 거의 수평으로 활영되었음
 * 상품명 단가 수령 금액 간의 수평거리는 어떠한 다른 요소들과의 수평거리보다 가까움
 * 상품명 단가 수량 금액 모두 정확히 찾아냈음(비록 오답인 요소가 함께 찾아졌을지라도)
 * 위에서 말한 오답인 요소는 정답요소와 수평위치에 있을 수 없음
 * 표시 상품은 부가세 면세품목입니다 를 정확히 하나만 찾아냈음 (굉장히 편한, 매우 위험한 가정)
 * 
 * 1. 상품명 단가 수량 금액 라인 찾기
 * 2. 표시 상품은 부가세 면세품목입니다 부분 찾기
 * 3. 1,2 번에서 찾은걸로 y축 범위 결정하기
 * 4. 상품명 단가 수량 금액들의 가로축 범위 결정하기
 */
const findItemRange = () => {

    // 1. 상품명 단가 수량 금액 라인 찾기
    const productName = getFulltextAnnoObjByReg(/상품명/)
    const unitPrice = getFulltextAnnoObjByReg(/단가/)
    const quantity = getFulltextAnnoObjByReg(/수량/)
    const amount = getFulltextAnnoObjByReg(/금액/)

    let productNameIndex: number;
    let unitPriceIndex: number;
    let quantityIndex: number;
    let amountIndex: number;

    let unitPriceAverageY: number;
    let quantityAverageY: number;
    
    // 상품명과 단가를 비교하여 세로축이 가장 인접한것 매칭
    let difference = 999;
    productName.forEach((productNameEle, productNameEleIdx) => {
        unitPrice.forEach((unitPriceEle, unitPriceEleIdx) => {
            const productNameEleAverageY = calAverageXorY(productNameEle, "y")
            const unitPriceEleAverageY = calAverageXorY(unitPriceEle, "y")
            const newDifference = Math.abs(productNameEleAverageY - unitPriceEleAverageY)
            if (newDifference < difference) {
                difference = newDifference
                productNameIndex = productNameEleIdx
                unitPriceIndex = unitPriceEleIdx
                unitPriceAverageY = unitPriceEleAverageY
            }
        })
    });

    // 단가를 기준으로 세로축방향으로 가장 인접한 수량 찾기
    difference = 999;
    quantity.forEach((quantityEle, quantityEleIdx) => {
        const quantityEleAverageY = calAverageXorY(quantityEle, "y")
        const newDifference = Math.abs(unitPriceAverageY - quantityEleAverageY)
        if (newDifference < difference) {
            difference = newDifference
            quantityIndex = quantityEleIdx
            quantityAverageY = quantityEleAverageY
        }
    });

    // 수량을 기준으로 세로축방향으로 가장 인접한 금액 찾기
    difference = 999;
    amount.forEach((amountEle, amountEleIdx) => {
        const amountEleAverageY = calAverageXorY(amountEle, "y")
        const newDifference = Math.abs(quantityAverageY - amountEleAverageY)
        if (newDifference < difference) {
            difference = newDifference
            amountIndex = amountEleIdx
        }
    });

    // 2. 표시 상품은 부가세 면세품목입니다 부분 찾기
    const taxExemptionMsg = getFulltextAnnoObjByReg(/표시 상품은 부가세 면세품목입니다/)

    // 3. 1,2 번에서 찾은걸로 y축 범위 결정하기
    const productNameYs = getXorYArr(productName[productNameIndex], "y")
    const unitPriceYs = getXorYArr(unitPrice[unitPriceIndex], "y")
    const quantityYs = getXorYArr(quantity[quantityIndex], "y")
    const amountYs = getXorYArr(amount[amountIndex], "y")
    const minY = Math.max(...productNameYs, ...unitPriceYs, ...quantityYs, ...amountYs)
    // maxY 는 taxExemptionMsg의 y 값 중에서 2번째로 작은값 (대체적으로 수평인 다양한 기울기에서 이게 기하학적으로 제일 안전하다)
    const maxY = getXorYArr(taxExemptionMsg[0], "y")
        .sort((a, b) => a - b)[1]

    // 4. 상품명 단가 수량 금액들의 가로축 범위 결정하기
    const unitPriceAverageX = calAverageXorY(unitPrice[unitPriceIndex], "x")
    const textAnnotationsMinX = Math.min(...getXorYArr(textAnnotations[0], "x", true))
    const productNameRangeX = [textAnnotationsMinX,unitPriceAverageX]
    const quantityMinX = Math.min(...getXorYArr(quantity[quantityIndex], "x"))
    const unitPriceRangeX = [unitPriceAverageX,quantityMinX]
    const quantityMaxX = Math.max(...getXorYArr(quantity[quantityIndex], "x"))
    const amountMinX = Math.min(...getXorYArr(amount[amountIndex], "x"))
    const quantityRangeX = [quantityMinX,(quantityMaxX+amountMinX)/2]
    const amountMaxX = Math.max(...getXorYArr(amount[amountIndex], "x"))
    const amountRangeX = [amountMinX,amountMaxX]
    const itemRangeY = [minY,maxY]

    return {productNameRangeX, unitPriceRangeX, quantityRangeX, amountRangeX, itemRangeY}

    function calAverageXorY(fullTextAnooObj, coordinate:"x"|"y") {
        return fullTextAnooObj[1].boundingBox.vertices.reduce((acc, cur) => acc + cur[coordinate], 0) / 4
    }

    function getXorYArr(AnnoObj, coordinate:"x"|"y", isTextAnno?) {
        if (isTextAnno === true) {
            return AnnoObj.boundingPoly.vertices.map((v) => v[coordinate])
        }
        else {
            return AnnoObj[1].boundingBox.vertices.map((v) => v[coordinate])
        }
    }
};


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

const {productNameRangeX, unitPriceRangeX, quantityRangeX, amountRangeX, itemRangeY} = findItemRange()

// 상품명
const productNameGroup = sortGroupAscByY(
    getFulltextAnnoObjByRange(productNameRangeX, itemRangeY, false)
);

// 단가
const unitPriceGroup = sortGroupAscByY(
    getFulltextAnnoObjByRange(unitPriceRangeX, itemRangeY, false, {includeWords: true, word: 1})
);

// 수량
const quantityGroup = sortGroupAscByY(
    getFulltextAnnoObjByRange(quantityRangeX, itemRangeY, false)
);

// 금액
const amountGroup = sortGroupAscByY(
    getFulltextAnnoObjByRange(amountRangeX, itemRangeY, false, {includeWords: true, word: 1})
);

/**
 * 그룹을 word 나 paragraph 단위로 만들어놔야한다고 생각해봤다.
 * 하지만 어차피 그 경우에도 문제는 있다.
 * word 로 하면 뛰어쓰기를 넘길테고
 * paragraph 로 하면 여러줄을 하나의 덩어리로 할 수도 있다.
 * 어차피 블록으로 찾아진것과 같은 문제는 존재한다. 오히려 더 복잡해질 수 있다.
 */

// console.log(productNameGroup.length)
// console.log(unitPriceGroup.length)
// console.log(quantityGroup.length)
// console.log(amountGroup.length)
/**
 * undefined
 * 행사할인 : 단가, 수량
 * 쿠폰할인 : 수량
 * 상품명 갯수 = 금액 갯수 이고 단가와 수량은 빈곳 존재하기때문에 갯수 모잘란다.
 * 우리는 row 갯수만큼의 길이를 가지는 배열들로 모든 그룹을 전환해주면 된다.
 * 이때 undefined 를 빈곳에 잘 넣어주기만 하면 된다.
 */
const getTextArraysFromGroups = (productNameGroup, unitPriceGroup, quantityGroup, amountGroup) => {
    // 각 Group 순회하며 Arr 만들기 (\n 기준으로 split 해서 배열로 만들어준다.)
    const productNameArray = makeArrFromGroup(productNameGroup);
    const unitPriceArray = makeArrFromGroup(unitPriceGroup);
    const quantityArray = makeArrFromGroup(quantityGroup);
    const amountArray = makeArrFromGroup(amountGroup);
    // 상품명 arr 에서 행사할인|쿠폰할인 들의 index 로 단가 수량 arr 에 undefined 삽입
    productNameArray.forEach((productName, index) => {
        if (productName.includes("행사할인")) {
            unitPriceArray.splice(index, 0, undefined);
            quantityArray.splice(index, 0, undefined);
        }
        else if (productName.includes("쿠폰할인")) {
            quantityArray.splice(index, 0, undefined);
        }
    })
    // 4개의 배열의 길이가 모두 같으면 정상임. 정상이면 완성된 배열들 리턴
    if (
        productNameArray.length === unitPriceArray.length &&
        unitPriceArray.length === quantityArray.length &&
        quantityArray.length === amountArray.length
    ) {
        return {productNameArray, unitPriceArray, quantityArray, amountArray};
    }
    else {
        return null;
    }

    function makeArrFromGroup(group) {
        let arr = []
        group.forEach((item) => {
            item[1].textStudy.split('\n').forEach((text) => { // textStudy 그냥 전부 text 로 통일하는게 좋지 않을까?
                if (text !== '') {
                    arr.push(text)
                }
            })
        })
        return arr
    };
};

const textArrays = getTextArraysFromGroups(productNameGroup, unitPriceGroup, quantityGroup, amountGroup)

// 다듬기
// 상품명: 숫자 두개로 시작하면 숫자 두개 제거, 공백으로 시작하거나 공백으로 끝나면 공백 제거
// 나머지: 공백으로 시작하거나 공백으로 끝나면 공백 제거, 쉼표+숫자+숫자+숫자 발견시 쉼표 제거(그냥 모든쉼표 제거로 대체)
const productNameArr = deleteSpacesEachEleOfFrontAndBackInArr(
    deleteStartingTwoNumbersEachEleInArr(textArrays.productNameArray)
);
const unitPriceArr = deleteAllCommaEachEleInArr(
    deleteSpacesEachEleOfFrontAndBackInArr(textArrays.unitPriceArray)
);
const quantityArr = deleteAllCommaEachEleInArr(
    deleteSpacesEachEleOfFrontAndBackInArr(textArrays.quantityArray)
);
const amountArr = deleteAllCommaEachEleInArr(
    deleteSpacesEachEleOfFrontAndBackInArr(textArrays.amountArray)
);

// . 이나 * 으로 시작하는 상품명은 부가세 면세제품이다. 이 부분은 일단은 스킵한다.


// console.log(productNameArr)
// console.log(unitPriceArr)
// console.log(quantityArr)
// console.log(amountArr)



function sortGroupAscByY(group) {
    return group.sort((a,b) => {
        const aVerticesY = a[1].boundingBox.vertices.map((v) => v.y)
        const bVerticesY = b[1].boundingBox.vertices.map((v) => v.y)
        return Math.min(...aVerticesY) - Math.min(...bVerticesY)
    })
};

function deleteStartingTwoNumbersEachEleInArr(arr) {
    return arr.map((ele) => {
        return ele.replace(/^[0-9]{2}/, '')
    })
};

function deleteSpacesEachEleOfFrontAndBackInArr(arr) {
    return arr.map((ele) => {
        if (ele === undefined) {
            return undefined
        }
        return ele.replace(/^[ ]+|[ ]+$/g, '')
    })
};

function deleteAllCommaEachEleInArr(arr) {
    return arr.map((ele) => {
        if (ele === undefined) {
            return undefined
        }
        return ele.replace(/,/g, '')
    })
};


// 항목객체 영수증객체 만들기
class Discount {
    constructor(
        public name: string,
        public amount: number,
        public code?: number
    ) {}
}
class ItemReadFromReceipt {
    constructor(
        public productName: string,
        public unitPrice: number,
        public quantity: number,
        public amount: number,
        public taxExemption?: boolean,
    ) {}
    public discountArray: Discount[] = [];
}
class ReceiptItem {
    constructor(
        public readFromReceipt: ItemReadFromReceipt,
        public category?: string
    ) {}
    public purchaseAmount: number;
    /**
     * discount 추가하기
    */
    addDiscount(discount: Discount) {
        this.readFromReceipt.discountArray.push(discount)
    }
}
class ReceiptReadFromReceipt {
    constructor(
        //시간
        //총가격
        //할인
        //결제
    ) {}
}
class Provider {
    constructor(
        // 이메일?
    ) {}
}
class OutputRequest {
    constructor(
        // 언제 어떤방식으로 어디로, 실행.성공여부?
    ) {}
}
class Receipt {
    constructor(
        public provider: Provider,
        public itemArray: ReceiptItem[],
        public readFromReceipt: ReceiptReadFromReceipt,
        public userInput?,
        public outputRequests?: OutputRequest[],
        public imageAddress?: string,
    ) {
        // purchaseAmount 계산하기
    }
}

/**
 * 항목객체 배열 만들기
 */
const makeReceiptItemArray = (productNameArr, unitPriceArr, quantityArr, amountArr):ReceiptItem[] => {
    const receiptItemArray = [];
    productNameArr.forEach((productName, idx) => {
        // 행사할인, 쿠폰할인 발견하면 Discount 객체 만들어서 바로 전 아이템에 넣어주기
        if (productName.includes("행사할인")) {
            const discount = new Discount(productName, amountArr[idx])
            receiptItemArray[receiptItemArray.length-1].addDiscount(discount)
        }
        else if (productName.includes("쿠폰할인")) {
            const discount = new Discount(productName, amountArr[idx], unitPriceArr[idx])
            receiptItemArray[receiptItemArray.length-1].addDiscount(discount)
        }
        else {
        // . 으로 시작하는것 발견하면 taxExemption = true 주고 . 제거하고 space 제거하기
            let taxExemption = false;
            if (productName.charAt(0) === ".") {
                productName = productName.replace(/^./, '').replace(/^[ ]+/g, '')
                taxExemption = true;
            }
            receiptItemArray.push(
                new ReceiptItem(
                    new ItemReadFromReceipt(
                        productName,
                        unitPriceArr[idx],
                        quantityArr[idx],
                        amountArr[idx],
                        taxExemption
                    )
                )
            );
        };
    });
    return receiptItemArray
};

const receiptItemArray = makeReceiptItemArray(productNameArr, unitPriceArr, quantityArr, amountArr);

console.log(receiptItemArray)