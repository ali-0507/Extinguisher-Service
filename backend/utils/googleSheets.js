async function sendToGoogleSheets(request) {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const secret = process.env.GOOGLE_SHEETS_SECRET;

  if (!url || !secret) {
    throw new Error("Google Sheets environment variables missing.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...request,
      secret
    }),
    redirect: "follow"
  });

  const responseText = await response.text();

  console.log("Google Sheets HTTP status:", response.status);
  console.log("Google Sheets response:", responseText.slice(0, 1000));

  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      "Google Sheets returned a non-JSON response."
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || `Google Sheets HTTP error: ${response.status}`
    );
  }

  return result;
}

module.exports = { sendToGoogleSheets };