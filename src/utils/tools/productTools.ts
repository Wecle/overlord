import z from "zod";
import { readMarkdownAsync } from "@/utils/files/readFile";

export class ProductToolkit {
  async getWeaponProductInfo() {
    const content = await readMarkdownAsync(`@prompts/products/weapon.json`);
    return { result: content };
  }

  async getFruitProductInfo() {
    const content = await readMarkdownAsync(`@prompts/products/fruit.json`);
    return { result: content };
  }

  async getPotionsProductInfo() {
    const content = await readMarkdownAsync(`@prompts/products/potions.json`);
    return { result: content };
  }

  getTools() {
    return {
      weaponProductInfo: {
        description: 'Get product list for buyer want to know more about weapon. This tool is used to get all product list from a JSON file with description, amount. When buyer want to know more about weapon, could use this tool to get product list',
        parameters: z.object({}),
        execute: this.getWeaponProductInfo.bind(this)
      },
      fruitProductInfo: {
        description: 'Get product list for buyer want to know more about fruit. This tool is used to get all product list from a JSON file with description, amount. When buyer want to know more about fruit, could use this tool to get product list',
        parameters: z.object({}),
        execute: this.getFruitProductInfo.bind(this)
      },
      potionsProductInfo: {
        description: 'Get product list for buyer want to know more about potions. This tool is used to get all product list from a JSON file with description, amount. When buyer want to know more about potions, could use this tool to get product list',
        parameters: z.object({}),
        execute: this.getPotionsProductInfo.bind(this)
      },
    };
  }
}