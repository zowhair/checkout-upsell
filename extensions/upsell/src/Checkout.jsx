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

  // Protection product global ID
  const protectionProductId = 'gid://shopify/Product/9080133746933';
  
  // Find protection product in cart (if exists)
  // This will automatically re-evaluate when lines changes
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

  async function handleAddToCart(variantId) {
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
        result = await applyCartLinesChange({
          type: 'addCartLine',
          merchandiseId: variantId,
          quantity: 1,
        });
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

function ProductOffer({ product, i18n, adding, handleAddToCart, protectionInCart, showError, upsellTitle }) {
  const { images, title, variants } = product;
  // const renderPrice = i18n.formatCurrency(variants.nodes[0].price.amount);
  const fullPrice = i18n.formatCurrency(variants.nodes[0].price.amount);
  const renderPrice = fullPrice.replace(/[A-Z]{3}\s*/, ''); // Removes currency code like USD, EUR, etc.
  const imageUrl =
    images.nodes[0]?.url ??
    'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_medium.png?format=webp&v=1530129081';

  const handleOfferClick = () => {
    if (!adding) {
      handleAddToCart(variants.nodes[0].id);
    }
  };

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
          columns={['auto', '15%', 'fill', 'auto']}
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
              If your package is lost, damaged or stolen in transit, our insurance offers coverage to replace your order, no questions asked.
            </Text>
          </View>
          
          <View padding="none" blockAlignment="center" inlineAlignment="end">
            <Text>{renderPrice}</Text>
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