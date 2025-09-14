## when using PayPal Tools, recheck parameter.
### format
When creating order using PayPal order tools, use following format:
create order sample:
```json
{
    "intent": "CAPTURE", 
    "purchase_units": [
        {        
        "description": "魔法商品",
        "amount": {
            "currency_code": "USD", 
            "value": "{{订单总金额}}" // 需与商品总价一致
        },
            
         "paypal": {
            "vault_id": "{{vault_id}}",
            "experience_context": {
                "return_url": "https://www.paypal.cn",
                "cancel_url": "https://www.paypal.cn"
            }
        }
    }  
```
