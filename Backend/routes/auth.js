const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db/pool");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        error: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "Email is already registered",
      });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    return res.status(201).json({
      message: "Account created successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      error: "Something went wrong during registration",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email?.trim() || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const result = await pool.query(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    const user = result.rows[0];

    // Check whether user exists
    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Compare submitted password with stored hash
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Regenerate session ID after successful authentication
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({
          error: "Could not create session",
        });
      }

      // Store user ID in the new session
      req.session.userId = user.id;

      // Explicitly save session before responding
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({
            error: "Could not save session",
          });
        }

        return res.status(200).json({
          message: "Login successful",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      error: "Something went wrong during login",
    });
  }
});


// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    // Check whether a session exists
    if (!req.session.userId) {
      return res.status(401).json({
        error: "Not authenticated",
      });
    }

    // Fetch the logged-in user's details
    const result = await pool.query(
      `SELECT id, name, email, created_at
       FROM users
       WHERE id = $1`,
      [req.session.userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);

      return res.status(500).json({
        error: "Could not log out",
      });
    }

    // Clear the session cookie in the browser
    res.clearCookie("connect.sid", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  });
});

module.exports = router;