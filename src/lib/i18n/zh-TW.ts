export interface Translations {
  menu: {
    noImage: string
    customizable: string
    addToCart: string
  }
  customization: {
    title: string
    close: string
    noSelection: string
    addOns: string
    noAddOns: string
    addToCartBtn: string
  }
  cart: {
    empty: string
    nameRequired: string
    orderFailed: string
    decreaseQty: string
    increaseQty: string
    removeItem: string
    namePlaceholder: string
    total: string
    processing: string
    checkout: string
    openCart: string
    itemCount: string
    viewCart: string
    cartTitle: string
    closeCart: string
  }
  order: {
    statusLabel: string
    submitted: string
    orderNumber: string
    total: string
    backToMenu: string
    syncDisclaimer: string
  }
  status: {
    placed: string
    paid: string
    done: string
    delivered: string
    completed: string
  }
  toggle: {
    switchToEnglish: string
    switchToChinese: string
  }
}

const zhTW: Translations = {
  menu: {
    noImage: '無圖片',
    customizable: '可客製',
    addToCart: '加入 {name}',
  },
  customization: {
    title: '客製 {name}',
    close: '關閉',
    noSelection: '不選{group}',
    addOns: '加料',
    noAddOns: '不加料',
    addToCartBtn: '加入購物車',
  },
  cart: {
    empty: '購物車是空的',
    nameRequired: '請輸入姓名',
    orderFailed: '訂單失敗，請重試',
    decreaseQty: '減少數量',
    increaseQty: '增加數量',
    removeItem: '移除 {name}',
    namePlaceholder: '顧客姓名（必填）',
    total: '總計',
    processing: '處理中...',
    checkout: '結帳',
    openCart: '開啟購物車，{count} 件，總計 ${total}',
    itemCount: '{count} 件商品',
    viewCart: '查看 →',
    cartTitle: '購物車',
    closeCart: '關閉購物車',
  },
  order: {
    statusLabel: '狀態',
    submitted: '訂單已送出！🎉',
    orderNumber: '訂單編號 #{id}',
    total: '總計',
    backToMenu: '回到選單',
    syncDisclaimer: '* 系統將自動同步 Notion 準備狀態，請耐心候餐',
  },
  status: {
    placed: '已點餐',
    paid: '已付款',
    done: '已做完',
    delivered: '已送達',
    completed: 'Done',
  },
  toggle: {
    switchToEnglish: '切換為英文',
    switchToChinese: '切換為中文',
  },
}

export default zhTW
