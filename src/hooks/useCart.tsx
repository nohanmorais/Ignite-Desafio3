import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { isTemplateTail } from 'typescript';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  
  const [cart, setCart] = useState<Product[]>(() => {
    
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      
      const verifyProduct = cart.find((product) => product.id === productId);

      const {data: product} = await api.get<Product>(`products/${productId}`);
      const {data: stock} = await api.get<Stock>(`stock/${productId}`)

      if(!verifyProduct) {

        const newProduct = {...product, amount: 1}

        if(newProduct.amount <= stock.amount) {
          
          setCart([...cart, newProduct]);
          localStorage.setItem(
            "@RocketShoes:cart", JSON.stringify([...cart, newProduct])
          );
        } else {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }     

      } else {

        if(verifyProduct.amount <= stock.amount){
          
          const updateCart = cart.map(item => item.id === verifyProduct.id ? {
            ...item,
            amount: item.amount + 1,
          } : item);
  
          setCart(updateCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
  
        } else {
          toast.error("Quantidade solicitada fora de estoque")
          return;
        }
      }
    } catch {
      toast.error("Erro na adição do produto")
    }
  };

  const removeProduct = (productId: number) => {
    try {
      
      const findProduct = cart.some(id => {return id.id === productId});

      if(!findProduct)  {
        toast.error("Erro na remoção do produto");
        return;
      }

      if(findProduct)  {
        
        const updateCart = cart.filter(id => {return id.id !== productId});
        setCart(updateCart);     
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));

      }
 
    } catch {
      toast.error("Erro ao remover produto do carrinho!")
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const {data: stock} = await api.get<Stock>(`stock/${productId}`);

      if(amount <= 0) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if(amount > stock.amount){
        toast.error("Quantidade solicitada fora de estoque");
        return;
      } 
      
      const findProduct = cart.map(item => item.id === productId ? {
        ...item,
        amount: amount,
      } : item);
      setCart(findProduct);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(findProduct));

    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
