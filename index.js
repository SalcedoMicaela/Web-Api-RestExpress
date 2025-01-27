import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config(); // Carga las variables de entorno desde el archivo .env

const app = express();
app.use(bodyParser.json());

// Configuración del pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
});

// Verificar la conexión a la base de datos
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Conexión exitosa a la base de datos MySQL");
        connection.release(); // Libera la conexión
    } catch (error) {
        console.error("Error al conectar a la base de datos:", error);
    }
})();

// Endpoint raíz
app.get("/", (req, res) => {
    res.send("WELCOME TO MY NODEJS APP");
});

// Obtener todos los productos
app.get("/products", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM Goalkeeper_gloves");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener los productos" });
    }
});

// Obtener un producto por ID
app.get("/products/:id", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM Goalkeeper_gloves WHERE id = ?", [req.params.id]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: "Producto no encontrado" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener el producto" });
    }
});

// Crear un nuevo producto
app.post("/products", async (req, res) => {
    const { serial_number, brand, model, size, color, is_new, price } = req.body;

    if (!serial_number || !brand || !model || !size || !color || is_new === undefined || !price) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    try {
        const query = `
            INSERT INTO Goalkeeper_gloves (serial_number, brand, model, size, color, is_new, price)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            serial_number,
            brand,
            model,
            size,
            color,
            is_new,
            price,
        ]);

        res.status(201).json({
            message: "Producto insertado exitosamente",
            product: {
                id: result.insertId,
                serial_number,
                brand,
                model,
                size,
                color,
                is_new,
                price,
            },
        });
    } catch (error) {
        console.error("Error al insertar el producto:", error);
        res.status(500).json({ message: "Error al insertar el producto", error });
    }
});


// Actualizar un producto por ID
app.put("/products/:id", async (req, res) => {
    const { serial_number, brand, model, size, color, is_new, price } = req.body;
    try {
        const [result] = await pool.query(
            "UPDATE Goalkeeper_gloves SET serial_number = ?, brand = ?, model = ?, size = ?, color = ?, is_new = ?, price = ? WHERE id = ?",
            [serial_number, brand, model, size, color, is_new, price, req.params.id]
        );
        if (result.affectedRows > 0) {
            res.json({
                id: req.params.id,
                serial_number,
                brand,
                model,
                size,
                color,
                is_new,
                price,
            });
        } else {
            res.status(404).json({ message: "Producto no encontrado" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar el producto" });
    }
});

// Eliminar un producto por ID
app.delete("/products/:id", async (req, res) => {
    try {
        const [result] = await pool.query("DELETE FROM Goalkeeper_gloves WHERE id = ?", [req.params.id]);
        if (result.affectedRows > 0) {
            res.json({ message: "Producto eliminado" });
        } else {
            res.status(404).json({ message: "Producto no encontrado" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar el producto" });
    }
});
app.get("/test-db-connection", async (req, res) => {
    try {
        // Prueba una consulta simple
        const [rows] = await pool.query("SHOW TABLES");
        res.json({
            message: "Conexión a la base de datos exitosa",
            tables: rows,
        });
    } catch (error) {
        console.error("Error al conectar a la base de datos:", error);
        res.status(500).json({ message: "Error al conectar a la base de datos", error });
    }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});





