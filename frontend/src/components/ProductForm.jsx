import { useState } from "react";
import { createProduct } from "../api/productApi";

function ProductForm({ onProductAdded }) {
    const [formData, setFormData] = useState({
        name: "",
        brand: "",
        category: "Tire",
        size: "",
        quantity: "",
        costPrice: "",
        sellingPrice: "",
        supplier: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        alert("handleSubmit started");
    
        try {
            console.log(formData);
    
            const response = await createProduct(formData);
    
            alert("Product created!");
    
            console.log(response);
    
            onProductAdded();
    
            setFormData({
                name: "",
                brand: "",
                category: "Tire",
                size: "",
                quantity: "",
                costPrice: "",
                sellingPrice: "",
                supplier: ""
            });
    
        } catch (error) {
            alert("Error occurred!");
    
            console.error(error);
    
            if (error.response) {
                console.log(error.response.data);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>

            <h2>Add Product</h2>

            <input
                type="text"
                placeholder="Product Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
            />

            <input
                type="text"
                placeholder="Brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
            />

            <input
                type="text"
                placeholder="Size"
                name="size"
                value={formData.size}
                onChange={handleChange}
            />

            <input
                type="number"
                placeholder="Quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
            />

            <input
                type="number"
                placeholder="Cost Price"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleChange}
            />

            <input
                type="number"
                placeholder="Selling Price"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
            />

            <input
                type="text"
                placeholder="Supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
            />

            <button type="submit">
                Add Product
            </button>

        </form>
    );
}

export default ProductForm;