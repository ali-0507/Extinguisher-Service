
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const { sendToGoogleSheets } = require("./utils/googleSheets");

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://thefirewala.in",
  "https://www.thefirewala.in",
  "https://the-fire-wala.vercel.app"
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "The Fire Wala backend is running."
  });
});

app.get("/api/health", (req, res) => {
  const configured =
    Boolean(process.env.GOOGLE_SHEETS_WEBHOOK_URL) &&
    Boolean(process.env.GOOGLE_SHEETS_SECRET);

  res.status(configured ? 200 : 500).json({
    success: configured,
    message: configured
      ? "Backend and Google Sheets configuration are ready."
      : "Google Sheets environment variables are missing.",
    googleSheets: configured ? "configured" : "not configured",
    database: "not required"
  });
});

// ==========================================
// SAVE SERVICE REQUEST TO GOOGLE SHEETS
// ==========================================

app.post("/api/service-requests", async (req, res) => {
  try {
    const {
      client_name,
      phone,
      email,
      company_name,
      service_type,
      additional_details,
      extinguisher_quantity
    } = req.body;

    // 1. Required field validation

    if (
      typeof client_name !== "string" ||
      typeof phone !== "string" ||
      typeof service_type !== "string" ||
      !client_name.trim() ||
      !phone.trim() ||
      !service_type.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and service type are required."
      });
    }

    // 2. Phone validation

    const cleanPhone = phone.trim().replace(/\s+/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit Indian phone number."
      });
    }

    // 3. Email validation

    let cleanEmail = null;

    if (email && email.trim() !== "") {
      cleanEmail = email.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address."
        });
      }
    }

    // 4. Quantity validation

    let quantity = null;

    if (
      extinguisher_quantity !== undefined &&
      extinguisher_quantity !== null &&
      extinguisher_quantity !== ""
    ) {
      quantity = Number(extinguisher_quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive whole number."
        });
      }
    }

    // 5. Prepare request data

    const requestData = {
      id: crypto.randomUUID(),
      client_name: client_name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      company_name:
        typeof company_name === "string"
          ? company_name.trim() || null
          : null,
      service_type: service_type.trim(),
      additional_details:
        typeof additional_details === "string"
          ? additional_details.trim() || null
          : null,
      extinguisher_quantity: quantity,
      status: "NEW",
      created_at: new Date().toISOString()
    };

    // 6. Save directly to Google Sheets
    // Wait for confirmation before telling the client it succeeded.

    await sendToGoogleSheets(requestData);

    console.log(
      "✅ Service request saved to Google Sheets:",
      requestData.id
    );

    return res.status(201).json({
      success: true,
      message: "Service request submitted successfully.",
      data: {
        id: requestData.id,
        client_name: requestData.client_name
      }
    });

  } catch (error) {
    console.error(
      "❌ Service request / Google Sheets error:",
      error.message
    );

    return res.status(502).json({
      success: false,
      message:
        "We could not save your request right now. Please try again."
    });
  }
});

// ==========================================
// 404 ROUTE
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found."
  });
});

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `The Fire Wala backend is running on port ${PORT}`
  );
});