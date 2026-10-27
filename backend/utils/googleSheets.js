
async function sendToGoogleSheets(request) {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const secret = process.env.GOOGLE_SHEETS_SECRET;

  if (!url || !secret) {
    throw new Error("Google Sheets environment variables missing");
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

 if (!response.ok) {
  const responseText = await response.text();

  console.error(
    "Google Sheets response body:",
    responseText
  );

  throw new Error(
    `Google Sheets HTTP error: ${response.status}`
  );
}

  const result = await response.json();

  if (!result.success) {
    throw new Error(
      result.message || "Google Sheets rejected the request"
    );
  }

  return result;
}

module.exports = { sendToGoogleSheets };