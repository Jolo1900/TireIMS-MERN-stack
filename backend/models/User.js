import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Admin", "Cashier"],
      default: "Cashier",
    },
  },
  {
    timestamps: true,
  }
);

// Match user-entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  // Support both bcrypt hashed passwords and legacy plain text passwords during transition
  if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$")) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
  return this.password === enteredPassword;
};

// Pre-save hook to hash password before storing in database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  // If already hashed, skip
  if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;
