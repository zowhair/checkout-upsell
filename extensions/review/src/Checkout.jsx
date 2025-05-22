import {
  reactExtension,
  Banner,
  BlockStack,
  Checkbox,
  BlockLayout,
  Text,
  InlineLayout,
  View,
  Image,
  Icon,
  Heading,
  useApi,
  useApplyAttributeChange,
  useInstructions,
  useTranslate,
  Divider,
  BlockSpacer,
  TextBlock,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";

// 1. Choose an extension target
export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const translate = useTranslate();
  const { extension } = useApi();
  const instructions = useInstructions();
  const applyAttributeChange = useApplyAttributeChange();
  const {
    banner_title,
    image_text,
    review_text,
    review_author
  } = useSettings();


  // 2. Check instructions for feature availability, see https://shopify.dev/docs/api/checkout-ui-extensions/apis/cart-instructions for details
  if (!instructions.attributes.canUpdateAttributes) {
    // For checkouts such as draft order invoices, cart attributes may not be allowed
    // Consider rendering a fallback UI or nothing at all, if the feature is unavailable
    return (
      <Banner title="Review" status="warning">
        {translate("attributeChangesAreNotSupported")}
      </Banner>
    );
  }

  // 3. Render a UI
  return (
    <>
      <BlockSpacer />
      <Divider />
      <BlockSpacer />


      <View border="none" padding="none" blockAlignment="start">
        <InlineLayout columns={['35%', '65%']} padding="none">
          <View border="none" padding="base" blockAlignment="start">
            <Image source="https://cdn.shopify.com/s/files/1/0798/0911/8242/files/flo_test_check_out_page_-_review_pic_1.webp?v=1747763252" />
            <View padding={["base", "none"]}>
              <Text>{image_text}</Text>
            </View>
          </View>
          <View border="none" padding="base" blockAlignment="center" inlineAlignment="start" >
            <InlineLayout columns={['fill', 'fill']} blockAlignment="start" >
              <View border="none" padding="none">
                <Image source="https://cdn.shopify.com/s/files/1/0798/0911/8242/files/stars_ffbcbf98-7437-4459-9e35-ca32fda3569e.svg?v=1747764367" />
              </View>
              <View border="none" padding="none" inlineAlignment="center">
                <Text size="small" appearance="subdued"> 04/02/202 </Text>
              </View>
            </InlineLayout>
            <View blockAlignment="center" padding={["large100", "none"]} maxBlockSize={10}>
              <Heading>{banner_title}</Heading>
            </View>
            <View padding="none">
              <Text>
                {review_text}
              </Text>
            </View>
            <View padding={["base", "none"]} maxBlockSize={20} blockAlignment="center">
              <Heading>{review_author}</Heading>
            </View>

          </View>
        </InlineLayout>
      </View>
    </>
  );

  async function onCheckboxChange(isChecked) {
    // 4. Call the API to modify checkout
    const result = await applyAttributeChange({
      key: "requestedFreeGift",
      type: "updateAttribute",
      value: isChecked ? "yes" : "no",
    });
    console.log("applyAttributeChange result", result);
  }
}