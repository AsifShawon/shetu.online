import { Search } from "lucide-react";

type SearchBoxProps = {
  action: string;
  placeholder?: string;
  name?: string;
};

export function SearchBox({
  action,
  placeholder = "Search with your preferred Subject",
  name = "keyword"
}: SearchBoxProps) {
  return (
    <form action={action} className="w-full">
      <div className="flex items-center overflow-hidden rounded-full border border-slate-300 bg-white shadow-sm">
        <input
          type="search"
          name={name}
          placeholder={placeholder}
          className="w-full border-0 bg-transparent px-5 py-4 text-sm outline-none"
        />
        <button
          type="submit"
          className="mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--legacy-primary)] text-white"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

