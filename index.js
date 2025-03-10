import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import cors from "cors";  // Importamos cors

dotenv.config(); 
const app = express();

// Habilitar CORS para todas las rutas
app.use(cors());  // Esto permitirá solicitudes desde cualquier origen

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
// Crear un nuevo producto
app.post('/gloves', async (req, res) => {
    const { serial_number, brand, model, size, color, is_new, price } = req.body;
    const checkQuery = 'SELECT * FROM Goalkeeper_gloves WHERE serial_number = ?';

    try {
        const [results] = await pool.query(checkQuery, [serial_number]);
        if (results.length > 0) {
            return res.status(400).json({ error: 'El número de serie ya está registrado' });
        }

        // Calcular precio con descuento si NO es nuevo
        let finalPrice = price;
        if (is_new == 0) { 
            if (price > 150) {
                finalPrice = price * 0.8; // 20% de descuento
            } else if (price >= 100 && price <= 150) {
                finalPrice = price * 0.85; // 15% de descuento
            } else {
                finalPrice = price * 0.9; // 10% de descuento
            }
        }

        const insertQuery = 'INSERT INTO Goalkeeper_gloves (serial_number, brand, model, size, color, is_new, price) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [result] = await pool.query(insertQuery, [serial_number, brand, model, size, color, is_new, finalPrice]);

        res.status(201).json({ message: 'Guantes registrados exitosamente', finalPrice });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al guardar los datos' });
    }
});

// Verificar descuentos aplicados a los guantes
app.get('/check-discounts', async (req, res) => {
    const query = 'SELECT serial_number, price AS original_price, price * ? AS final_price, is_new FROM Goalkeeper_gloves';

    try {
        // Aquí, "1" es el multiplicador (sin descuento) por defecto
        const [results] = await pool.query(query, [1]);

        const updatedGloves = results.map(glove => {
            let finalPrice = glove.original_price;

            // Aplicar descuento si no es nuevo
            if (glove.is_new === 0) {  // Si no es nuevo
                if (glove.original_price > 150) {
                    finalPrice = glove.original_price * 0.8;  // 20% descuento
                } else if (glove.original_price >= 100 && glove.original_price <= 150) {
                    finalPrice = glove.original_price * 0.85;  // 15% descuento
                } else {
                    finalPrice = glove.original_price * 0.9;  // 10% descuento
                }
            }

            glove.final_price = finalPrice;
            return glove;
        });

        res.status(200).json(updatedGloves);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener los datos' });
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



app.post('/products', async (req, res) => {
    const { serial_number, brand, model, size, color, is_new, price } = req.body;

    if (!serial_number || !brand || !model || !size || !color || is_new === undefined || !price) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        const query = `
            INSERT INTO Goalkeeper_gloves (serial_number, brand, model, size, color, is_new, price) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

        await pool.query(query, [serial_number, brand, model, size, color, is_new, price]);

        res.status(201).json({ message: "Producto agregado correctamente" });
    } catch (error) {
        console.error("Error en el POST:", error);
        res.status(500).json({ error: "Error al agregar el producto" });
    }
});


