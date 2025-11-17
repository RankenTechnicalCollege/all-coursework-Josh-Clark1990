import { useState } from 'react';
import { nanoid } from 'nanoid';
import CartItem from './cartItem';

interface Item {
  id: string;
  name: string;
  quantity: number;
}

export default function CartList() {
  const [items, setItems] = useState<Item[]>([
    { id: nanoid(), name: 'Hat', quantity: 2 },
    { id: nanoid(), name: 'Tie', quantity: 2 },
    { id: nanoid(), name: 'Belt', quantity: 1 },
  ]);

  let itemCount = 0;
  for (const item of items) {
    if (item && item.quantity) {
      itemCount += item.quantity;
    }
  }

  function onNameChange(evt: React.ChangeEvent<HTMLInputElement>, item: Item) {
    const newItems = [...items];
    const index = items.indexOf(item);
    newItems[index].name = evt.target.value;
    setItems(newItems);
  }

  function onAddQuantity(item: Item) {
    const newQuantity = item.quantity + 1;
    if (newQuantity <= 10) {
      const newItems = [...items];
      const index = items.indexOf(item);
      newItems[index].quantity++;
      setItems(newItems);
    }
  }

  function onSubtractQuantity(item: Item) {
    const newQuantity = item.quantity - 1;
    if (newQuantity > 0) {
      const newItems = [...items];
      const index = items.indexOf(item);
      newItems[index].quantity--;
      setItems(newItems);
    } else {
      setItems(items.filter((i) => i.id !== item.id));
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-4xl font-bold text-blue-600">Shopping Cart</h1>
        <span className="px-4 py-2 text-lg font-semibold bg-blue-600 text-white rounded-full">
          {itemCount > 0 ? itemCount : 'Empty'}
        </span>
      </div>
      
      {itemCount === 0 && (
        <p className="text-gray-500 text-lg mb-4">Please add items to cart</p>
      )}

      <button
        type="button"
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mb-4"
        onClick={() =>
          setItems([...items, { id: nanoid(), name: '', quantity: 1 }])
        }
      >
        Add Item
      </button>

      <div className="space-y-2">
        {items.map((item) => (
          <CartItem
            item={item}
            key={item.id}
            onNameChange={(evt) => onNameChange(evt, item)}
            onAddQuantity={() => onAddQuantity(item)}
            onSubtractQuantity={() => onSubtractQuantity(item)}
          />
        ))}
      </div>
    </div>
  );
}