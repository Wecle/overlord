import z from 'zod'
import { Product } from '@/types/products'

export class ProductBtnTool {
  getTools () {
    return {
      show_product_btn: {
        description: '当用户想要查看商品时显示按钮',
        parameters: z.object({
          products: z.array(z.object({
            name: z.string(),
            description: z.string(),
            price: z.number(),
            currency: z.string(),
          }))
        }),
        execute: async ({ products }: { products: Product[] }) => {
          return {
            products,
          }
        }
      }
    }
  }
}

