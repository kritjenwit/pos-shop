export function generateThaiQRPayment(
  target: string,
  amount: number | string | null = null
): string {
  const ID_PAYLOAD_FORMAT = "00";
  const ID_POI_METHOD = "01";
  const ID_MERCHANT_INFORMATION_BOT = "29";
  const ID_TRANSACTION_CURRENCY = "53";
  const ID_TRANSACTION_AMOUNT = "54";
  const ID_COUNTRY_CODE = "58";
  const ID_CRC = "63";

  const PAYLOAD_FORMAT_EMV_QRCPS_MERCHANT_PRESENTED_MODE = "01";
  const POI_METHOD_STATIC = "11";
  const POI_METHOD_DYNAMIC = "12";

  const MERCHANT_INFORMATION_TEMPLATE_ID_GUID = "00";
  const BOT_ID_MERCHANT_PHONE_NUMBER = "01";
  const BOT_ID_MERCHANT_TAX_ID = "02";
  const BOT_ID_MERCHANT_EWALLET_ID = "03";

  const GUID_PROMPTPAY = "A000000677010111";
  const TRANSACTION_CURRENCY_THB = "764";
  const COUNTRY_CODE_TH = "TH";

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

  if (cleanTarget.length >= 15) {
    targetType = BOT_ID_MERCHANT_EWALLET_ID;
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
    emv(
      ID_MERCHANT_INFORMATION_BOT,
      [
        emv(MERCHANT_INFORMATION_TEMPLATE_ID_GUID, GUID_PROMPTPAY),
        emv(targetType, formatTarget(cleanTarget))
      ].join("")
    ),
    emv(ID_COUNTRY_CODE, COUNTRY_CODE_TH),
    emv(ID_TRANSACTION_CURRENCY, TRANSACTION_CURRENCY_THB)
  ];

  if (hasAmount) {
    data.push(emv(ID_TRANSACTION_AMOUNT, formatAmount(amount)));
  }

  const dataToCrc = data.join("") + ID_CRC + "04";
  const checksum = crc16(dataToCrc);

  data.push(emv(ID_CRC, checksum));

  return data.join("");
}