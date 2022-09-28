// 영수증 객체
class Receipt {

    constructor(
        public provider: Provider,
        public itemArray: ReceiptItem[],
        public readFromReceipt: ReceiptReadFromReceipt,
        public imageAddress: string,
        public providerInput?,
        public outputRequests?: OutputRequest[],
    ) {
        /** 체크, 보정
         * 
         * - 각 item 안에 있는 check 들
         * - 모든 item amount 의 합이 총합계와 같은지
         * - 모든 item 의 discount amount 의 합이 모든 총할인 합과 같은지
         * - 구매금액 = 총합계 - 모든 총할인
         *  문제가 있을경우 더 많은 조건들을 체크하면서 점검, 보정해서 완성할 수 있어야한다. (조건은 충분해 보임)
         * 
         * 과세 정보 섹션 체크 (과세품목 정확히 알아낼 수 있어야한다)
         * 결제 섹션 체크
         */

        // 체크, 보정 다 끝나면
        this.itemArray.forEach(item => {
            item.conplete()
        })
        // 결제섹션에서 결제할인 된것 각 item 별 구매금액에서 퍼센드로 계산해서 실 구매가 계산해주기
    }
};

// -------------------------------------------------------------------------

    class Provider {

        constructor(
            public emailAddress: string,
        ) {}
    };

    // 구매 아이템 객체
    class ReceiptItem {

        constructor(
            public readFromReceipt: ItemReadFromReceipt,
            public category?: string
        ) {}

        public itemDiscountAmount: number;
        public purchaseAmount: number;

        /**
         * 할인금액 음수인지 확인하기
         */
        discountAmountIsNegative() {
            let result = []
            this.readFromReceipt.discountArray.forEach((discount, idx) => {
                if (discount.amount > 0) {
                    result.push(idx)
                }
            })
            if (result.length === 0) {
                return true
            }
            else {
                return result
            }
        }

        /**
         * 단가 x 수량 === 금액
         */
        amountEqualsUnitpriceXquantity() {
            return this.readFromReceipt.unitPrice * this.readFromReceipt.quantity === this.readFromReceipt.amount
        }
        
        /**
         * discount 추가하기
         */
        addDiscount(discount: Discount) {
            this.readFromReceipt.discountArray.push(discount)
        }

        /**
         * 할인금액 합산하기
         */
        protected sumDiscountAmount() {
            this.itemDiscountAmount = this.readFromReceipt.discountArray.reduce((acc, cur) => acc + cur.amount, 0)
        }

        /**
         * 구매금액 계산하기
         */
        protected calPurchaseAmount() {
            this.purchaseAmount = this.readFromReceipt.amount + this.itemDiscountAmount
        }

        /**
         * #### 완성하기
         * 
         * - 궁극적으로는 readFromReceipt 에서 사용할수있는 모든것들을 밖으로 빼야한다.
         * - 지금은 readFromReceipt 를 사용중.
         */
        conplete() {
            // 완성이 안됬으면 실행할 수 않는 어떤 조건을 주고싶다.
            this.sumDiscountAmount()
            this.calPurchaseAmount()
        }
    };

        // 구매 아이템의 영수증에서 읽은 rare data
        class ItemReadFromReceipt {

            public unitPrice: number
            public quantity: number
            public amount: number

            constructor(
                public productName: string,
                unitPrice: number,
                quantity: number,
                amount: number,
                public taxExemption?: boolean,
            ) {
                this.unitPrice = Number(unitPrice)
                this.quantity = Number(quantity)
                this.amount = Number(amount)
            }
            public discountArray: Discount[] = [];
        };

            class Discount {

                public amount: number
                public code?: number

                constructor(
                    public name: string,
                    amount: number,
                    code?: number
                ) {
                    this.amount = Number(amount)
                    if (code !== undefined) this.code = Number(code)
                }
            };

    // 영수증에서 읽은 영구증의 rare data
    class ReceiptReadFromReceipt {

        public taxProductAmount: number
        public taxAmount: number
        public taxExemptionProductAmount: number

        constructor(
            public date: Date,
            public name: string,
            public tel: string,
            public address: string,
            public owner: string,
            public businessNumber: string,
            taxProductAmount: number,
            taxAmount: number,
            taxExemptionProductAmount: number,
            public tm?: string,
            public no?: string,
            //총가격
            //할인
            //결제
        ) {
            this.taxProductAmount = Number(taxProductAmount)
            this.taxAmount = Number(taxAmount)
            this.taxExemptionProductAmount = Number(taxExemptionProductAmount)
        }
    };

    class OutputRequest {

        constructor(
            // 언제 어떤방식으로 어디로, 실행.성공여부?
        ) {}
    };

export {ReceiptItem, Discount, ItemReadFromReceipt, Receipt, Provider, ReceiptReadFromReceipt}
