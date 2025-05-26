import React, { useEffect, useState } from "react";
import {
  reactExtension,
  Divider,
  Image,
  Banner,
  Heading,
  View,
  Pressable,
  InlineLayout,
  BlockStack,
  Text,
  SkeletonText,
  SkeletonImage,
  useCartLines,
  useApplyCartLinesChange,
  useApi,
  Checkbox,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => <App />);

function App() {
  const { query, i18n } = useApi();
  const applyCartLinesChange = useApplyCartLinesChange();
  const { upsell_title } = useSettings();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showError, setShowError] = useState(false);
  const lines = useCartLines();
  const { subscription_desc } = useSettings();

  // Protection product global ID
  const protectionProductId = 'gid://shopify/Product/9122280964341';

  // Find protection product in cart (if exists)
  const protectionLineItem = lines.find(line =>
    line.merchandise.product && line.merchandise.product.id === protectionProductId
  );
  const protectionInCart = Boolean(protectionLineItem);

  // Initial data fetch
  useEffect(() => {
    fetchProducts('checkout_upsell');
  }, []);

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showError]);
  useEffect(() => {
    if (!loading && products.length > 0 && !protectionInCart) {
      const product = products[0];
      const variant = product.variants.nodes[0];
      const sellingPlanAllocations = variant?.sellingPlanAllocations?.nodes || [];

      const subscriptionPlan = sellingPlanAllocations.find(allocation =>
        allocation.sellingPlan.recurringDeliveries === true
      );

      if (subscriptionPlan && variant.id) {
        handleAddToCart(variant.id, subscriptionPlan.sellingPlan.id);
      }
    }
  }, [loading, products, protectionInCart]);
  async function handleAddToCart(variantId, sellingPlanId = null) {
    if (adding) return;

    setAdding(true);

    try {
      let result;
      // Re-check current cart state to be safe
      const currentProtectionLineItem = lines.find(line =>
        line.merchandise.product && line.merchandise.product.id === protectionProductId
      );

      if (currentProtectionLineItem) {
        result = await applyCartLinesChange({
          type: 'removeCartLine',
          id: currentProtectionLineItem.id,
          quantity: currentProtectionLineItem.quantity
        });
      } else {
        // Create cart line with selling plan
        const cartLineInput = {
          type: 'addCartLine',
          merchandiseId: variantId,
          quantity: 1,
        };

        // Add selling plan if provided
        if (sellingPlanId) {
          cartLineInput.sellingPlanId = sellingPlanId;
        }

        result = await applyCartLinesChange(cartLineInput);
      }

      if (result.type === 'error') {
        setShowError(true);
        console.error("Cart update error:", result.message);
      }
    } catch (error) {
      setShowError(true);
      console.error("Cart update error:", error);
    } finally {
      setAdding(false);
    }
  }

  async function fetchProducts(tag) {
    setLoading(true);
    try {
      const { data } = await query(
        `query ($first: Int!, $tag: String!) {
          products(first: $first, query: $tag) {
            nodes {
              id
              title
              description
              images(first:1){
                nodes {
                  url
                }
              }
              variants(first: 1) {
                nodes {
                  id
                  price {
                    amount
                  }
                  sellingPlanAllocations(first: 10) {
                    nodes {
                      sellingPlan {
                        id
                        name
                        description
                        options {
                          name
                          value
                        }
                        priceAdjustments {
                          adjustmentValue {
                            ... on SellingPlanFixedAmountPriceAdjustment {
                              adjustmentAmount {
                                amount
                                currencyCode
                              }
                            }
                            ... on SellingPlanPercentagePriceAdjustment {
                              adjustmentPercentage
                            }
                          }
                          orderCount
                        }
                        recurringDeliveries
                      }
                      priceAdjustments {
                        price {
                          amount
                          currencyCode
                        }
                        compareAtPrice {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                }
              }
              tags
            }
          }
        }`,
        {
          variables: { first: 100, tag: `tag:'${tag}'` },
        }
      );
      setProducts(data.products.nodes);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!loading && products.length === 0) {
    return null;
  }

  // Filter out products that might already be in cart (if needed)
  const productsOnOffer = getProductsOnOffer(lines, products);

  if (!productsOnOffer.length) {
    return null;
  }

  return (
    <ProductOffer
      product={productsOnOffer[0]}
      i18n={i18n}
      adding={adding}
      handleAddToCart={handleAddToCart}
      showError={showError}
      protectionInCart={protectionInCart}
      upsellTitle={upsell_title}
      subsDescription={subscription_desc}
    />
  );
}

function LoadingSkeleton() {
  return (
    <BlockStack spacing="loose">
      <Divider />
      <Checkbox>
        <Heading level={2}>Add Package Protection</Heading>
        <BlockStack spacing="loose">
          <InlineLayout
            spacing="base"
            columns={[64, 'fill', 'auto']}
            blockAlignment="center"
          >
            <SkeletonImage aspectRatio={1} />
            <BlockStack spacing="none">
              <SkeletonText inlineSize="large" />
              <SkeletonText inlineSize="small" />
            </BlockStack>
          </InlineLayout>
        </BlockStack>
      </Checkbox>
    </BlockStack>
  );
}

function getProductsOnOffer(lines, products) {
  /*
  const cartLineProductVariantIds = lines.map((item) => item.merchandise.id);
  
  return products.filter((product) => {
    const isProductVariantInCart = product.variants.nodes.some(({ id }) =>
      cartLineProductVariantIds.includes(id)
    );
    return !isProductVariantInCart;
  });
  */

  return products;
}

function ProductOffer({ product, i18n, adding, handleAddToCart, protectionInCart, showError, upsellTitle, subsDescription }) {
  const { images, title, variants, description } = product;
  const variant = variants.nodes[0];

  // Get the selling plan (subscription plan)
  const sellingPlanAllocations = variant?.sellingPlanAllocations?.nodes || [];
  const subscriptionPlan = sellingPlanAllocations.find(allocation =>
    allocation.sellingPlan.recurringDeliveries === true
  );

  // Use subscription price if available, otherwise use regular price
  const price = subscriptionPlan?.priceAdjustments?.price?.amount || variant.price.amount;
  const compareAtPrice = subscriptionPlan?.priceAdjustments?.compareAtPrice?.amount;

  const fullPrice = i18n.formatCurrency(price);
  const renderPrice = fullPrice.replace(/[A-Z]{3}\s*/, ''); // Removes currency code like USD, EUR, etc.

  const imageUrl =
    images.nodes[0]?.url ??
    'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_medium.png?format=webp&v=1530129081';

  const handleOfferClick = () => {
    if (!adding) {
      // Pass selling plan ID if subscription plan exists
      const sellingPlanId = subscriptionPlan?.sellingPlan?.id || null;
      handleAddToCart(variant.id, sellingPlanId);
    }
  };

  // Get subscription frequency info
  const getSubscriptionInfo = () => {
    if (!subscriptionPlan) return null;

    const options = subscriptionPlan.sellingPlan.options || [];
    const deliveryOption = options.find(option =>
      option.name.toLowerCase().includes('delivery') ||
      option.name.toLowerCase().includes('frequency')
    );

    return deliveryOption?.value || 'Monthly';
  };

  const subscriptionInfo = getSubscriptionInfo();
  const hasSavings = compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price);


  return (
    <>
      <Pressable
        border="base"
        cornerRadius="base"
        padding="base"
        background="base"
        onPress={handleOfferClick}
        disabled={adding}
      >
        <InlineLayout
          columns={['auto', '12%', 'fill', 'auto']}
          spacing="base"
          blockAlignment="center"
        >
          <View padding="none" blockAlignment="center">
            <Checkbox
              id="package-protection"
              name="package-protection"
              checked={protectionInCart}
              disabled={adding}
              onChange={handleOfferClick}
            />
          </View>

          <View padding="none" blockAlignment="center">
            <Image
              border="base"
              borderWidth="base"
              borderRadius="base"
              cornerRadius="base"
              source={imageUrl}
              accessibilityDescription={title}
            />
          </View>

          <View padding="none" blockAlignment="center">
            <Text size="base" emphasis="bold">{upsellTitle}</Text>
            <Text appearance="subdued">
              {description}
            </Text>
            <BlockStack spacing="extraTight">
              <Text size="small" appearance="success">
                {subsDescription}
              </Text>
            </BlockStack>
          </View>

          <View padding="none" blockAlignment="center" inlineAlignment="end">
            <Text>FREE</Text>
          </View>
        </InlineLayout>
      </Pressable>

      {showError && <ErrorBanner />}
    </>
  );
}

function ErrorBanner() {
  return (
    <Banner status="critical">
      There was an issue updating your cart. Please try again or refresh the page.
    </Banner>
  );
}