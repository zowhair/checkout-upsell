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
    first_description,
    second_title,
    second_description,
    third_title,
    third_description,
    fourth_title,
    fourth_description
  } = useSettings();

  // 2. Check instructions for feature availability, see https://shopify.dev/docs/api/checkout-ui-extensions/apis/cart-instructions for details
  if (!instructions.attributes.canUpdateAttributes) {
    // For checkouts such as draft order invoices, cart attributes may not be allowed
    // Consider rendering a fallback UI or nothing at all, if the feature is unavailable
    return (
      <Banner title="Flo Promise" status="warning">
        {translate("attributeChangesAreNotSupported")}
      </Banner>
    );
  }

  // 3. Render a UI
  return (
    <BlockLayout rows={[50, 'fill']} border="base" cornerRadius="small">
      <View border="none" padding="base" inlineAlignment="center">
        <Heading level="1">
          {banner_title}
        </Heading>
      </View>
      <BlockStack spacing="none">
        <View border="none" padding="none" blockAlignment="center">
          <InlineLayout columns={['16%', 'fill']} blockAlignment="center">
            <View border="none" padding="base">
              <Image source="https://cdn.shopify.com/s/files/1/0798/0911/8242/files/science.webp?v=1747763252" />
            </View>
            <View border="none" padding="base">
              <Heading>
                {first_title}
              </Heading>
              <Text>
                {first_description}
              </Text>
            </View>
          </InlineLayout>
        </View>
        <View border="none" padding="none" >
          <InlineLayout columns={['16%', 'fill']} blockAlignment="center">
            <View border="none" padding="base">
              <Image source="https://cdn.shopify.com/s/files/1/0798/0911/8242/files/check.webp?v=1747763252" />
            </View>
            <View border="none" padding="base">
              <Heading>
                {second_title}
              </Heading>
              <Text>
                {second_description}
              </Text>
            </View>
          </InlineLayout>
        </View>
        <View border="none" padding="none" >
          <InlineLayout columns={['16%', 'fill']} blockAlignment="center">
            <View border="none" padding="base">
              <Image source="https://cdn.shopify.com/s/files/1/0798/0911/8242/files/calendar.webp?v=1747763252" />
            </View>
            <View border="none" padding="base">
              <Heading>
                {third_title}
              </Heading>
              <Text>
                {third_description}
              </Text>
            </View>
          </InlineLayout>
        </View>
        <View border="none" padding="none" >
          <InlineLayout columns={['16%', 'fill']} blockAlignment="center">
            <View border="none" padding="base">
              <Image source="https://cdn.shopify.com/s/files/1/0798/0911/8242/files/unlock.webp?v=1747763252" />
            </View>
            <View border="none" padding="base">
              <Heading>
                {fourth_title}
              </Heading>
              <Text>
                {fourth_description}
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