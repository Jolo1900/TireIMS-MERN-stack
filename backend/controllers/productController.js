import Product from "../models/Product.js";

// GET all products with server-side pagination, search, filtering, and sorting
export const getProducts = async (req, res) => {
    try {
        const { search, brand, lowStock, sortBy, page, limit } = req.query;

        let query = {};

        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { brand: { $regex: search, $options: "i" } },
                { size: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } }
            ];
        }

        // Brand filter
        if (brand) {
            query.brand = brand;
        }

        // Low stock filter
        if (lowStock === "true") {
            query.$expr = { $lte: ["$quantity", "$lowStockThreshold"] };
        }

        // Sort options
        let sortOption = { createdAt: -1 };
        if (sortBy) {
            switch (sortBy) {
                case "name-asc": sortOption = { name: 1 }; break;
                case "name-desc": sortOption = { name: -1 }; break;
                case "brand-asc": sortOption = { brand: 1 }; break;
                case "qty-asc": sortOption = { quantity: 1 }; break;
                case "qty-desc": sortOption = { quantity: -1 }; break;
                case "price-asc": sortOption = { sellingPrice: 1 }; break;
                case "price-desc": sortOption = { sellingPrice: -1 }; break;
            }
        }

        // Handle pagination vs full listing
        if (page || limit) {
            const pageNum = parseInt(page, 10) || 1;
            const limitNum = parseInt(limit, 10) || 10;
            const skip = (pageNum - 1) * limitNum;

            const [items, totalCount] = await Promise.all([
                Product.find(query).sort(sortOption).skip(skip).limit(limitNum).lean(),
                Product.countDocuments(query)
            ]);

            const totalPages = Math.ceil(totalCount / limitNum) || 1;

            return res.status(200).json({
                items,
                data: items,
                totalCount,
                totalPages,
                page: pageNum,
                limit: limitNum
            });
        }

        // Return lean plain JSON documents for maximum performance
        const products = await Product.find(query).sort(sortOption).lean();
        res.status(200).json(products);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// CREATE a product
export const createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).lean();

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json(product);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).lean();

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json(product);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id).lean();

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            message: "Product deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Seed sample tire products if database is empty
export const seedDefaultProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.create([
        {
          name: "Primacy 4",
          brand: "Michelin",
          category: "Tire",
          size: "205/55R16",
          quantity: 18,
          costPrice: 3200,
          sellingPrice: 4500,
          supplier: "Michelin Distribution PH",
          lowStockThreshold: 5
        },
        {
          name: "Turanza T005",
          brand: "Bridgestone",
          category: "Tire",
          size: "215/60R17",
          quantity: 12,
          costPrice: 3800,
          sellingPrice: 5200,
          supplier: "Bridgestone Commercial",
          lowStockThreshold: 5
        },
        {
          name: "Eagle F1 Asymmetric",
          brand: "Goodyear",
          category: "Tire",
          size: "225/45R18",
          quantity: 4,
          costPrice: 4500,
          sellingPrice: 6300,
          supplier: "Goodyear Trading",
          lowStockThreshold: 5
        },
        {
          name: "UltraContact UC6",
          brand: "Continental",
          category: "Tire",
          size: "195/65R15",
          quantity: 0,
          costPrice: 2800,
          sellingPrice: 3900,
          supplier: "Continental Tires Asia",
          lowStockThreshold: 5
        },
        {
          name: "Cinturato P7",
          brand: "Pirelli",
          category: "Tire",
          size: "245/40R19",
          quantity: 8,
          costPrice: 5500,
          sellingPrice: 7800,
          supplier: "Pirelli Imports",
          lowStockThreshold: 5
        },
        {
          name: "BluEarth AE51",
          brand: "Yokohama",
          category: "Tire",
          size: "185/65R15",
          quantity: 25,
          costPrice: 2400,
          sellingPrice: 3400,
          supplier: "Yokohama Philippines",
          lowStockThreshold: 5
        }
      ]);
      console.log("Database seeded: Default tire inventory products created.");
    }
  } catch (error) {
    console.error("Error seeding default products:", error.message);
  }
};