export interface Product {
  name: string
  description: string
  sku: string
  price: number
  currency: string
  quantity: number
  type: string
  weight_kg: number
  dimensions_cm: string
  material: string
  certification: string
}

export interface Products {
  products: Product[]
}
