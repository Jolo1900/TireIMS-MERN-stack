import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "tireims_super_secret_key_2026";

// Login controller
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Verify password using bcrypt match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Seed/Reset default users to ensure credentials always work
export const seedDefaultUsers = async () => {
  try {
    const adminUser = await User.findOne({ username: "admin" });
    if (!adminUser) {
      await User.create({
        username: "admin",
        password: "admin123",
        role: "Admin",
      });
      console.log("Seeded default admin account.");
    } else {
      const isMatch = await adminUser.matchPassword("admin123");
      if (!isMatch) {
        adminUser.password = "admin123";
        await adminUser.save();
        console.log("Reset admin password to admin123.");
      }
    }

    const cashierUser = await User.findOne({ username: "cashier" });
    if (!cashierUser) {
      await User.create({
        username: "cashier",
        password: "cashier123",
        role: "Cashier",
      });
      console.log("Seeded default cashier account.");
    } else {
      const isMatch = await cashierUser.matchPassword("cashier123");
      if (!isMatch) {
        cashierUser.password = "cashier123";
        await cashierUser.save();
        console.log("Reset cashier password to cashier123.");
      }
    }
  } catch (error) {
    console.error("Error seeding/resetting users:", error.message);
  }
};
