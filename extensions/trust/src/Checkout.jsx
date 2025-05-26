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
    first_title, 
    second_title, 
    third_title, 
    fourth_title 
  } = useSettings();


  // 2. Check instructions for feature availability, see https://shopify.dev/docs/api/checkout-ui-extensions/apis/cart-instructions for details
  if (!instructions.attributes.canUpdateAttributes) {
    // For checkouts such as draft order invoices, cart attributes may not be allowed
    // Consider rendering a fallback UI or nothing at all, if the feature is unavailable
    return (
      <Banner title="Trust" status="warning">
        {translate("attributeChangesAreNotSupported")}
      </Banner>
    );
  }

  // 3. Render a UI
  return (
    <BlockLayout rows={[50, 'fill']} border="none" >
      <View border="none" padding={["base", "none"]} blockAlignment="start">
        <InlineLayout columns={['fill']} padding="none" >
          <Heading>{banner_title}</Heading>
        </InlineLayout>
      </View>
      <BlockStack spacing="small100">
        <View border="none" padding="none" blockAlignment="center">
          <InlineLayout columns={['11%', 'fill']} padding="none" >
            <View border="none" padding="none">
              <Image source="https://cdn.shopify.com/s/files/1/0798/0911/8242/files/verified_icon_5bd9ac45-0469-49d6-ac69-1651849b7e56.webp?v=1747763252" />
            </View>
            <View border="none" padding="base" blockAlignment="center">
              <Text>
                {first_title}
              </Text>
            </View>
          </InlineLayout>
        </View>
        <View border="none" padding="none" >
          <InlineLayout columns={['11%', 'fill']} padding="none">
            <View border="none" padding="none">
              <Image source="https://cdn.shopify.com/s/files/1/0798/0911/8242/files/usa.webp?v=1747763252" />
            </View>
            <View border="none" padding="base" blockAlignment="center">
              <Text>
                {second_title}
              </Text>
            </View>
          </InlineLayout>
        </View>
        <View border="none" padding="none" >
          <InlineLayout columns={['11%', 'fill']} padding="none">
            <View border="none" padding="none">
              <Image source="https://cdn.shopify.com/s/files/1/0798/0911/8242/files/yoga.webp?v=1747763252" />
            </View>
            <View border="none" padding="base" blockAlignment="center">
              <Text>
                {third_title}
              </Text>
            </View>
          </InlineLayout>
        </View>
        <View border="none" padding="none">
          <InlineLayout columns={['11%', 'fill']} padding="none">
            <View border="none" padding="none">
              <Image source="https://cdn.shopify.com/s/files/1/0798/0911/8242/files/start.webp?v=1747763252" />
            </View>
            <View border="none" padding="base" blockAlignment="center">
              <Text>
                {fourth_title}
              </Text>
            </View>
          </InlineLayout>
        </View>
      </BlockStack>

    </BlockLayout>
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