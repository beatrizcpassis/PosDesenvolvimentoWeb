import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { Product } from './Models/Product';
import { ProductSummary } from './Models/ProductSummary';


// Função para verificar se a categoria é permitida
async function isCategoryAllowed(category: string): Promise<[string, boolean]> {
  try {
    const response = await axios.get(`https://posdesweb.igormaldonado.com.br/api/allowedCategory?category=${encodeURIComponent(category)}`);
    return [category, response.data.allowed === true];
  } catch (error: any) {
    console.error(`Erro ao verificar categoria "${category}":`, error.message);
    return [category, false];
  }
}

// Função para ler o arquivo products.json
async function readProductsFile(): Promise<Product[]> {
  const filePath = path.resolve(__dirname, '../base/products.json');
  const data = await readFile(filePath, 'utf-8');
  const productsJson = JSON.parse(data);

  return productsJson.map((p: any) => new Product(
    p.id,
    p.name,
    p.description,
    p.price,
    p.category,
    p.pictureUrl
  ));
}

// Função para obter categorias únicas dos produtos
function getUniqueCategories(products: Product[]): string[] {
  return [...new Set(products.map(p => p.category))];
}

// Função para filtrar produtos com base nas categorias permitidas
function filterAllowedProducts(products: Product[], allowedCategories: Map<string, boolean>): ProductSummary[] {
  return products
    .filter(product => allowedCategories.get(product.category))
    .map(product => ({
      id: product.id,
      name: product.name
    }));
}

// Função para escrever os produtos permitidos no arquivo processed.json
async function writeProcessedProducts(filteredProducts: ProductSummary[]): Promise<void> {
  const outputPath = path.resolve(__dirname, '../base/processed.json');
  await writeFile(outputPath, JSON.stringify(filteredProducts, null, 2), 'utf-8');
  console.log(`Arquivo processed.json criado com ${filteredProducts.length} produtos permitidos!`);
}

// Função principal para processar os produtos
async function processProducts() {
  try {
    const products = await readProductsFile();
    const categories = getUniqueCategories(products);

    const allowedCategoryResults = await Promise.all(categories.map(category => isCategoryAllowed(category)));
    const allowedCategories = new Map<string, boolean>(allowedCategoryResults);
    const filteredProducts = filterAllowedProducts(products, allowedCategories);

    await writeProcessedProducts(filteredProducts);
  } catch (error: any) {
    console.error('Erro ao processar produtos:', error.message);
  }
}

processProducts();
