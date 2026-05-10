export function generateThaiQRPayment(
  target: string,
  amount: number | string | null = null,
  reference?: string,
  reference2?: string
): string {
  const ID_PAYLOAD_FORMAT = "00";
  const ID_POI_METHOD = "01";
  const ID_MERCHANT_INFORMATION_BOT = "29";
  const ID_BILL_PAYMENT_BOT = "30";
  const ID_MCC = "52";
  const ID_TRANSACTION_CURRENCY = "53";
  const ID_TRANSACTION_AMOUNT = "54";
  const ID_COUNTRY_CODE = "58";
  const ID_ADDITIONAL_DATA = "62";
  const ID_CRC = "63";

  const PAYLOAD_FORMAT_EMV_QRCPS_MERCHANT_PRESENTED_MODE = "01";
  const POI_METHOD_STATIC = "11";
  const POI_METHOD_DYNAMIC = "12";

  const BOT_ID_MERCHANT_PHONE_NUMBER = "01";
  const BOT_ID_MERCHANT_TAX_ID = "02";
  const BOT_ID_MERCHANT_EWALLET_ID = "03";
  const BOT_ID_BILLER_ID = "01";
  const BOT_ID_REF1 = "02";
  const BOT_ID_REF2 = "03";

  const SUBID_BOT_GUID = "00";
  const SUBID_ADDITIONAL_DATA_REF1 = "05";

  const GUID_PROMPTPAY = "A000000677010111";
  const GUID_BILL_PAYMENT = "A000000677010112";

  const TRANSACTION_CURRENCY_THB = "764";
  const COUNTRY_CODE_TH = "TH";
  const DEFAULT_MCC = "0000";

  function sanitizeTarget(value: string) {
    return String(value).replace(/\D/g, "");
  }

  function formatTarget(value: string) {
    let result = sanitizeTarget(value);

    if (result.length < 13) {
      result = result.replace(/^0/, "66");
      result = ("0000000000000" + result).slice(-13);
    }

    return result;
  }

  function formatAmount(value: number | string) {
    return Number(value).toFixed(2);
  }

  function emv(id: string, value: string) {
    if (!value) return "";
    const len = String(value).length.toString().padStart(2, "0");
    return id + len + value;
  }

  function crc16(input: string) {
    let crc = 0xffff;

    for (let i = 0; i < input.length; i++) {
      crc ^= input.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }

    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  const cleanTarget = sanitizeTarget(target);
  let targetType = BOT_ID_MERCHANT_PHONE_NUMBER;
  let isBillPayment = false;

  // Detect Biller ID (15 digits, typically starting with Tax ID)
  // E-Wallet IDs are also 15 digits but usually start with '1'.
  if (cleanTarget.length === 15) {
    if (cleanTarget.startsWith("1")) {
      targetType = BOT_ID_MERCHANT_EWALLET_ID;
    } else {
      isBillPayment = true;
    }
  } else if (cleanTarget.length >= 13) {
    targetType = BOT_ID_MERCHANT_TAX_ID;
  }

  const hasAmount =
    amount !== null &&
    amount !== undefined &&
    amount !== "" &&
    !Number.isNaN(Number(amount)) &&
    Number(amount) > 0;

  const data = [
    emv(ID_PAYLOAD_FORMAT, PAYLOAD_FORMAT_EMV_QRCPS_MERCHANT_PRESENTED_MODE),
    emv(ID_POI_METHOD, hasAmount ? POI_METHOD_DYNAMIC : POI_METHOD_STATIC),
  ];

  if (isBillPayment) {
    data.push(
      emv(
        ID_BILL_PAYMENT_BOT,
        [
          emv(SUBID_BOT_GUID, GUID_BILL_PAYMENT),
          emv(BOT_ID_BILLER_ID, cleanTarget),
          reference ? emv(BOT_ID_REF1, reference) : "",
          reference2 ? emv(BOT_ID_REF2, reference2) : ""
        ].join("")
      )
    );
  } else {
    data.push(
      emv(
        ID_MERCHANT_INFORMATION_BOT,
        [
          emv(SUBID_BOT_GUID, GUID_PROMPTPAY),
          emv(targetType, formatTarget(cleanTarget))
        ].join("")
      )
    );
  }

  data.push(emv(ID_MCC, DEFAULT_MCC));
  data.push(emv(ID_TRANSACTION_CURRENCY, TRANSACTION_CURRENCY_THB));

  if (hasAmount) {
    data.push(emv(ID_TRANSACTION_AMOUNT, formatAmount(amount)));
  }

  data.push(emv(ID_COUNTRY_CODE, COUNTRY_CODE_TH));

  // Add Tag 62 for AnyID with reference (Additional Data Field Template)
  if (!isBillPayment && (reference || reference2)) {
    const additionalData = [
      reference ? emv(SUBID_ADDITIONAL_DATA_REF1, reference) : "",
      // reference2 could be Terminal ID (07) but usually Ref1 is enough
    ].join("");
    if (additionalData) {
      data.push(emv(ID_ADDITIONAL_DATA, additionalData));
    }
  }

  const dataToCrc = data.join("") + ID_CRC + "04";
  const checksum = crc16(dataToCrc);

  data.push(emv(ID_CRC, checksum));

  return data.join("");
}