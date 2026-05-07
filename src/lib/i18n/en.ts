import type { Translations } from './zh-TW'

const en: Translations = {
  menu: {
    noImage: 'No image',
    customizable: 'Customizable',
    addToCart: 'Add {name}',
  },
  customization: {
    title: 'Customize {name}',
    close: 'Close',
    noSelection: 'No {group}',
    addOns: 'Add-ons',
    noAddOns: 'No add-on',
    addToCartBtn: 'Add to cart',
  },
  cart: {
    empty: 'Your cart is empty',
    nameRequired: 'Please enter your name',
    orderFailed: 'Order failed, please try again',
    decreaseQty: 'Decrease quantity',
    increaseQty: 'Increase quantity',
    removeItem: 'Remove {name}',
    namePlaceholder: 'Customer name (required)',
    total: 'Total',
    processing: 'Processing...',
    checkout: 'Checkout',
    openCart: 'Open cart, {count} items, total ${total}',
    itemCount: '{count} items',
    viewCart: 'View →',
    cartTitle: 'Cart',
    closeCart: 'Close cart',
  },
  order: {
    statusLabel: 'Status',
    submitted: 'Order placed! 🎉',
    orderNumber: 'Order #{id}',
    total: 'Total',
    backToMenu: 'Back to Menu',
    syncDisclaimer: '* Order status syncs automatically. Please wait.',
  },
  status: {
    placed: 'Order Placed',
    paid: 'Paid',
    done: 'Preparing',
    delivered: 'Delivered',
    completed: 'Completed',
  },
  toggle: {
    switchToEnglish: 'Switch to English',
    switchToChinese: 'Switch to Chinese',
  },
}

export default en
