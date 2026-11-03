const express = require("express");
// const { Pool } = require("pg");
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
  "https://thefirewala.in",
  "https://www.thefirewala.in"
];
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));



// POSTGRESQL DATABASE CONNECTION

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl:
//     process.env.NODE_ENV === "production"
//       ? { rejectUnauthorized: false }
//       : false,
// });

// Test database connection
// pool
//   .query("SELECT NOW()")
//   .then((result) => {
//     console.log("✅ PostgreSQL database connected!");
//     console.log("🕒 Database time:", result.rows[0].now);
//   })
//   .catch((error) => {
//     console.error("❌ PostgreSQL connection error:", error.message);
//   });

// =====================================================
// BASIC / HEALTH CHECK ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "The Fire Wala backend is running!",
  });
});

// app.get("/api/health", async (req, res) => {
//   try {
//     await pool.query("SELECT 1");

//     res.status(200).json({
//       success: true,
//       message: "Backend and database are working!",
//       database: "connected",
//     });
//   } catch (error) {
//     console.error("Health check error:", error.message);

//     res.status(500).json({
//       success: false,
//       message: "Database connection failed.",
//       database: "disconnected",
//     });
//   }
// });


app.get("/api/health", (req, res) => {
  const sheetsConfigured = Boolean(
    process.env.GOOGLE_SHEETS_WEBHOOK_URL &&
    process.env.GOOGLE_SHEETS_SECRET
  );

  res.status(sheetsConfigured ? 200 : 503).json({
    success: sheetsConfigured,
    message: sheetsConfigured
      ? "Backend and Google Sheets configuration are ready."
      : "Google Sheets environment variables are missing.",
    googleSheets: sheetsConfigured ? "configured" : "not configured",
  });
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
    } = req.body || {};

    // -------------------------------------------------
    // 1. REQUIRED FIELD VALIDATION
    // -------------------------------------------------

    if (
      typeof client_name !== "string" ||
      !client_name.trim() ||
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof service_type !== "string" ||
      !service_type.trim()
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
    // 5. PREPARE REQUEST DATA
    // -------------------------------------------------

   const serviceRequest = {
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

      status: "New",

      created_at: new Date().toISOString(),
    };

    // -------------------------------------------------
    // 6. INSERT DATA INTO POSTGRESQL
    // -------------------------------------------------

    
// const query = `
//   INSERT INTO service_request (
//     client_name,
//     phone,
//     email,
//     company_name,
//     service_type,
//     additional_details,
//     extinguisher_quantity
//   )
//   VALUES ($1, $2, $3, $4, $5, $6, $7)
//   RETURNING
//     id,
//     client_name,
//     phone,
//     email,
//     company_name,
//     service_type,
//     additional_details,
//     extinguisher_quantity,
//     status,
//     created_at
// `;

//     const values = [
//       cleanClientName,
//       cleanPhone,
//       cleanEmail,
//       cleanCompanyName,
//       cleanServiceType,
//       cleanAdditionalDetails,
//       quantity,
//     ];

// const result = await pool.query(query, values);

// const savedRequest = result.rows[0];

// res.status(201).json({
//   success: true,
//   message: "Service request saved successfully",
//   data: savedRequest,
// });


   // -------------------------------------------------
    // 6. SAVE DIRECTLY TO GOOGLE SHEETS
    // -------------------------------------------------

    console.log(
      "📩 New service request received:",
      serviceRequest.id
    );

    await sendToGoogleSheets(serviceRequest);

    console.log(
      "✅ Service request saved to Google Sheets:",
      serviceRequest.id
    );
// GOOGLE SHEETS SYNC - BACKGROUND

// setImmediate(() => {
//   sendToGoogleSheets(savedRequest)
//     .then(() => {
//       console.log(
//         "✅ Request synced to Google Sheets:",
//         savedRequest.id
//       );
//     })
//     .catch((error) => {
//       console.error(
//         "⚠️ Google Sheets sync failed:",
//         error.message
//       );
//     });
// });


// } catch (error) {
//   console.error(
//     "❌ Error saving service request:",
//     error.message
//   );

//   return res.status(500).json({
//     success: false,
//     message:
//       "Unable to save service request. Please try again later.",
//   });
// }
// });


// -------------------------------------------------
    // 7. SEND SUCCESS RESPONSE
    // -------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Service request saved successfully.",
      data: serviceRequest,
    });

  } catch (error) {
    console.error(
      "❌ Error saving service request:",
      error.message
    );

    return res.status(502).json({
      success: false,
      message:
        "Unable to save your request right now. Please try again later.",
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