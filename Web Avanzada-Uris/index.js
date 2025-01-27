import express from 'express';
import fs from "fs";
import bodyParser from "body-parser";
const app = express();
app.use(bodyParser.json());
const readData = () =>{
    try {
        const data = fs.readFileSync("./db.json");
        return JSON.parse(data);
    }catch(error){
        console.log(error);
    }
   
};
const writeData = (data) =>{
    try {
        fs.writeFileSync("./db.json", JSON.stringify(data));
    }catch(error){
        console.log(error);
    }
   
};

app.get("/", (req,res) => {
    res.send("WELCOME TO MY nodejs hghg");
});

app.get("/products", (req,res) => {
    const data = readData();
    res.json(data.products);
});

app.get("/products/:id", (req, res) => {
    const data = readData(); // Obtén los datos de los productos
    const id = parseInt(req.params.id); // Convierte el ID de la URL a un número entero
    const product = data.products.find((product) => product.id === id); // Busca el producto por su ID

    if (product) {
        res.json(product); // Si se encuentra el producto, devuélvelo
    } else {
        res.status(404).json({ message: "Product not found" }); // Si no se encuentra el producto
    }
});

app.post("/products", (req, res) => {
    const data = readData(); // Obtén los datos de los productos
    const body = req.body;
    const newProduct = {

        id: data.products.length + 1,
        ...body,
    };
    data.products.push(newProduct);
    writeData(data);
    res.json(newProduct);
});

app.put("/products/:id", (req, res) => {
    const data = readData(); // Obtén los datos de los productos
    const body = req.body;
    const id = parseInt(req.params.id); // Convierte el ID de la URL a un número entero
    const productIndex = data.products.findIndex((product) => product.id === id);
    data.products[productIndex] = {
        ...data.products[productIndex],
        ...body,
    };
    writeData(data);
    res.json(data.products[productIndex]);
});

app.delete("/products/:id", (req, res) => {
    const data = readData(); // Obtén los datos de los productos
    const id = parseInt(req.params.id); // Convierte el ID de la URL a un número entero
    const productIndex = data.products.findIndex((product) => product.id === id);
    data.products.splice(productIndex,1);

   
    writeData(data);
    res.json({message: "product deleted "});
});

app.listen(3000, () =>{
    console.log('Server listening on port 3000');
});

