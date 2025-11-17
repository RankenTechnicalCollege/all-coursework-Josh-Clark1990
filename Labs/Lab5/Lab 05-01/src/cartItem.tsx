interface Item {
  id: string;
  name: string;
  quantity: number;
}

interface CartItemProps {
  item: Item;
  onNameChange: (evt: React.ChangeEvent<HTMLInputElement>, item: Item) => void;
  onAddQuantity: (item: Item) => void;
  onSubtractQuantity: (item: Item) => void;
}

export default function CartItem({
  item,
  onNameChange,
  onAddQuantity,
  onSubtractQuantity,
}: CartItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm mb-3" key={item.id}>
      <div className="flex-1">
        <input
          type="text"
          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            item.name.length > 0
              ? 'border-green-500 focus:ring-green-500'
              : 'border-red-500 focus:ring-red-500'
          }`}
          value={item.name}
          onChange={(evt) => onNameChange(evt, item)}
          placeholder="Item name"
        />
      </div>
      <div className="w-16 text-center">
        <span className="text-lg font-semibold text-gray-700">{item.quantity}</span>
      </div>
      <div className="flex gap-2">
        <button
          className="w-10 h-10 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          disabled={item.quantity <= 0}
          onClick={() => onSubtractQuantity(item)}
        >
          -
        </button>
        <button
          className="w-10 h-10 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          disabled={item.quantity >= 10}
          onClick={() => onAddQuantity(item)}
        >
          +
        </button>
      </div>
    </div>
  );
}