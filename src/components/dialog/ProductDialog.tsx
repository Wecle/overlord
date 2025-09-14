"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Product } from "@/types/products"
import { ShoppingCart } from "lucide-react"

interface ProductDialogProps {
  products: Product[]
  onConfirm?: (selectedProducts: Product[]) => void
}

export function ProductDialog({ products, onConfirm }: ProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])

  const handleClick = () => {
    setOpen(true)
  }

  const handleProductSelect = (product: Product, checked: boolean) => {
    if (checked) {
      setSelectedProducts((prev) => [...prev, product])
    } else {
      setSelectedProducts((prev) => prev.filter((p) => p !== product))
    }
  }

  const handleConfirm = () => {
    onConfirm?.(selectedProducts)
    setOpen(false)
    setSelectedProducts([])
  }

  const handleCancel = () => {
    setOpen(false)
    setSelectedProducts([])
  }

  return (
    <div className="py-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="bg-green-600 text-white hover:bg-green-700 shadow-lg border-2 border-green-500 transition-all duration-200 hover:shadow-green-500/25 hover:text-white"
            variant="outline"
            onClick={handleClick}
          >
            <ShoppingCart /> 查看商品
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[60vw] max-w-[60vw] sm:max-w-[60vw] max-h-[80vh] flex flex-col bg-gray-900/95 backdrop-blur-sm border-2 border-green-600 shadow-2xl">
          <DialogHeader className="border-b border-green-600/30 pb-4">
            <DialogTitle className="text-xl font-bold text-green-400 flex items-center gap-2">
              <span className="text-2xl">🏪</span>
              商店货架
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              共 {products.length} 个商品，已选择 <span className="text-yellow-400 font-semibold">{selectedProducts.length}</span> 个
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product, index) => (
                <div key={index} className="bg-black/40 border-2 border-green-600/30 hover:border-green-500/60 rounded-lg p-4 transition-all duration-200 hover:bg-black/60 hover:shadow-lg hover:shadow-green-500/10 flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <Checkbox
                      id={`product-${index}`}
                      checked={selectedProducts.includes(product)}
                      onCheckedChange={(checked) => handleProductSelect(product, checked as boolean)}
                      className="mt-1 border-green-600 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 flex-shrink-0"
                    />
                    <label htmlFor={`product-${index}`} className="font-semibold text-lg cursor-pointer text-white hover:text-green-400 transition-colors leading-tight">
                      {product.name}
                    </label>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xl font-bold text-yellow-400 drop-shadow-lg">
                      💰 {product.price} {product.currency}
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed">{product.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4 border-t border-green-600/30 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-gray-600 text-gray-800"
            >
              取消
            </Button>
            <Button
              className="bg-green-600 text-white hover:bg-green-700 shadow-lg border-2 border-green-500 transition-all duration-200 hover:shadow-green-500/25 disabled:opacity-50 disabled:hover:shadow-none"
              onClick={handleConfirm}
              disabled={selectedProducts.length === 0}
            >
              确认选择 ({selectedProducts.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
