import jwt from "jsonwebtoken";
import User from "../models/User.js";

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
      process.env.JWT_SECRET,
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

// Seed default users if none exist
export const seedDefaultUsers = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      await User.create([
        {
          username: "admin",
          password: "admin123",
          role: "Admin",
        },
        {
          username: "cashier",
          password: "cashier123",
          role: "Cashier",
        },
      ]);
      console.log("Database seeded: default admin and cashier accounts created.");
    }
  } catch (error) {
    console.error("Error seeding users:", error.message);
  }
};
