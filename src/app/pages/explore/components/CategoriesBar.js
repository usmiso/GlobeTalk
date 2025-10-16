"use client";

export default function CategoriesBar({ categories, selectedCategory, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map(({ name, icon: Icon }) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition ${
            selectedCategory === name
              ? "bg-primary text-primary-foreground shadow"
              : "bg-white border-[0.5px] border-gray-200 hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
          {name}
        </button>
      ))}
    </div>
  );
}
