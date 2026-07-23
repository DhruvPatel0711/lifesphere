/**
 * Twilio SMS Dispatch Utility
 */

export async function sendSosSms(to: string, messageBody: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber || accountSid === "your_twilio_account_sid") {
    console.warn(`[Twilio SMS - Dev Mode] SMS for ${to}: "${messageBody}"`);
    return true;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const params = new URLSearchParams();
    params.append("To", to);
    params.append("From", fromNumber);
    params.append("Body", messageBody);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Twilio SMS Error]", response.status, errText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Twilio SMS Dispatch Failed]", error);
    return false;
  }
}
