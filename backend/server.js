const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();
const { sendToGoogleSheets } = require("./utils/googleSheets");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://the-fire-wala.vercel.app",
];
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());



// POSTGRESQL DATABASE CONNECTION

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Test database connection
pool
  .query("SELECT NOW()")
  .then((result) => {
    console.log("✅ PostgreSQL database connected!");
    console.log("🕒 Database time:", result.rows[0].now);
  })
  .catch((error) => {
    console.error("❌ PostgreSQL connection error:", error.message);
  });

// =====================================================
// BASIC / HEALTH CHECK ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "The Fire Wala backend is running!",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      success: true,
      message: "Backend and database are working!",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check error:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed.",
      database: "disconnected",
    });
  }
});


// POST API: SAVE CUSTOMER SERVICE REQUEST
app.post("/api/service-requests", async (req, res) => {
  try {
    const {
      client_name,
      phone,
      email,
      company_name,
      service_type,
      additional_details,
      extinguisher_quantity,
    } = req.body;

    // -------------------------------------------------
    // 1. REQUIRED FIELD VALIDATION
    // -------------------------------------------------

    if (
      !client_name?.trim() ||
      !phone?.trim() ||
      !service_type?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and service type are required.",
      });
    }

    // -------------------------------------------------
    // 2. PHONE VALIDATION
    // -------------------------------------------------

    const cleanPhone = phone.trim().replace(/\s+/g, "");

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit Indian phone number.",
      });
    }

    // -------------------------------------------------
    // 3. EMAIL VALIDATION
    // -------------------------------------------------

    let cleanEmail = null;

    if (email && email.trim() !== "") {
      cleanEmail = email.trim();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address.",
        });
      }
    }

    // -------------------------------------------------
    // 4. EXTINGUISHER QUANTITY VALIDATION
    // -------------------------------------------------

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
          message: "Quantity must be a positive whole number.",
        });
      }
    }

    // -------------------------------------------------
    // 5. PREPARE DATA
    // -------------------------------------------------

    const cleanClientName = client_name.trim();
    const cleanCompanyName =
      company_name?.trim() || null;
    const cleanServiceType = service_type.trim();
    const cleanAdditionalDetails =
      additional_details?.trim() || null;

    // -------------------------------------------------
    // 6. INSERT DATA INTO POSTGRESQL
    // -------------------------------------------------

    
const query = `
  INSERT INTO service_request (
    client_name,
    phone,
    email,
    company_name,
    service_type,
    additional_details,
    extinguisher_quantity
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING
    id,
    client_name,
    phone,
    email,
    company_name,
    service_type,
    additional_details,
    extinguisher_quantity,
    status,
    created_at
`;

    const values = [
      cleanClientName,
      cleanPhone,
      cleanEmail,
      cleanCompanyName,
      cleanServiceType,
      cleanAdditionalDetails,
      quantity,
    ];

const result = await pool.query(query, values);

const savedRequest = result.rows[0];

res.status(201).json({
  success: true,
  message: "Service request saved successfully",
  data: savedRequest,
});


// GOOGLE SHEETS SYNC - BACKGROUND

setImmediate(() => {
  sendToGoogleSheets(savedRequest)
    .then(() => {
      console.log(
        "✅ Request synced to Google Sheets:",
        savedRequest.id
      );
    })
    .catch((error) => {
      console.error(
        "⚠️ Google Sheets sync failed:",
        error.message
      );
    });
});


} catch (error) {
  console.error(
    "❌ Error saving service request:",
    error.message
  );

  return res.status(500).json({
    success: false,
    message:
      "Unable to save service request. Please try again later.",
  });
}
});

// =====================================================
// 404 ROUTE
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((error, req, res, next) => {
  console.error("❌ Server error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 The Fire Wala backend is running on port ${PORT}`);
});