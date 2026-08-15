import Transaction from "../models/Transaction.js";
import Product from "../models/Product.js";

// GET all transactions
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE (Record) a single stock transaction
export const createTransaction = async (req, res) => {
  const { productId, type, quantity, notes } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const qtyChange = Number(quantity);
    if (isNaN(qtyChange) || qtyChange <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive number" });
    }

    let netQty = 0;

    if (type === "Sale") {
      if (product.quantity < qtyChange) {
        return res.status(400).json({ message: "Insufficient stock for this sale" });
      }
      product.quantity -= qtyChange;
      netQty = -qtyChange;
    } else if (type === "Restock") {
      product.quantity += qtyChange;
      netQty = qtyChange;
    } else if (type === "Adjustment") {
      const direction = req.body.direction || "add"; 
      const adjQty = direction === "subtract" ? -qtyChange : qtyChange;
      
      if (adjQty < 0 && product.quantity < Math.abs(adjQty)) {
        return res.status(400).json({ message: "Insufficient stock for this adjustment" });
      }
      product.quantity += adjQty;
      netQty = adjQty;
    } else {
      return res.status(400).json({ message: "Invalid transaction type" });
    }

    await product.save();

    const transaction = await Transaction.create({
      productId: product._id,
      productName: `${product.brand} ${product.name} (${product.size})`,
      type,
      quantity: netQty,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      notes: notes || "",
    });

    res.status(201).json({ transaction, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE POS batch transaction (Sale of multiple items)
export const createPosTransaction = async (req, res) => {
  const { items, notes, cashierName } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Cart items are required" });
  }

  try {
    const productsToUpdate = [];
    
    // Phase 1: Verification
    for (const item of items) {
      if (item.isService) {
        const saleQty = Number(item.quantity);
        if (isNaN(saleQty) || saleQty <= 0) {
          return res.status(400).json({ message: `Invalid quantity for service ${item.productName}` });
        }
        const price = Number(item.sellingPrice);
        if (isNaN(price) || price < 0) {
          return res.status(400).json({ message: `Invalid price for service ${item.productName}` });
        }
        productsToUpdate.push({ isService: true, productName: item.productName, saleQty, sellingPrice: price });
        continue;
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
      }

      const saleQty = Number(item.quantity);
      if (isNaN(saleQty) || saleQty <= 0) {
        return res.status(400).json({ message: `Invalid quantity for product ${product.name}` });
      }

      if (product.quantity < saleQty) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.brand} ${product.name}. Available: ${product.quantity}, Requested: ${saleQty}` 
        });
      }

      productsToUpdate.push({ product, saleQty });
    }

    // Phase 2: Save updates and write logs
    const createdLogs = [];
    for (const entry of productsToUpdate) {
      if (entry.isService) {
        const { productName, saleQty, sellingPrice } = entry;
        const transaction = await Transaction.create({
          productId: undefined,
          productName: `Service: ${productName}`,
          type: "Sale",
          quantity: -saleQty,
          costPrice: 0,
          sellingPrice: sellingPrice,
          notes: notes || `POS Service by ${cashierName || "Cashier"}`,
        });
        createdLogs.push(transaction);
        continue;
      }

      const { product, saleQty } = entry;
      
      product.quantity -= saleQty;
      await product.save();

      const transaction = await Transaction.create({
        productId: product._id,
        productName: `${product.brand} ${product.name} (${product.size})`,
        type: "Sale",
        quantity: -saleQty,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        notes: notes || `POS Sale by ${cashierName || "Cashier"}`,
      });

      createdLogs.push(transaction);
    }

    res.status(201).json({
      success: true,
      message: "POS transaction processed successfully",
      transactions: createdLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE a transaction and revert stock
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const product = await Product.findById(transaction.productId);
    if (product) {
      // Revert quantity change: subtract the quantity change logged in the transaction
      // transaction.quantity is negative for Sales, positive for Restocks
      const revertedQty = product.quantity - transaction.quantity;
      if (revertedQty < 0) {
        return res.status(400).json({
          message: `Cannot delete transaction: Reverting this change would result in negative stock for ${product.brand} ${product.name}.`
        });
      }
      product.quantity = revertedQty;
      await product.save();
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Transaction deleted and stock reverted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
