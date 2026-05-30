export const plans = {
  CombinedTracker: {
    title: "CombinedTracker",
    checkoutUrl: "https://evolve-10165.myshopify.com/cart/45636289888358:1",
    variantId: 45636289888358,
  },
  MoneyTracker: {
    title: "MoneyTracker",
    checkoutUrl: "https://evolve-10165.myshopify.com/cart/45636288446566:1",
    variantId: 45636288446566,
  },
  HabitTracker: {
    title: "HabitTracker",
    checkoutUrl: "https://evolve-10165.myshopify.com/cart/45636276551782:1",
    variantId: 45636276551782,
  },
};

export interface ShopifyOrdersPaidWebhook {
  id: number;

  email: string;

  financial_status: string;

  currency: string;

  current_total_price: string;

  note: string | null;

  line_items: {
    variant_id: number;
    title: string;
    quantity: number;
  }[];

  note_attributes: {
    name: string;
    value: string;
  }[];
  customer: {
    id: number;
  };
}
