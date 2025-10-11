'use client';

import { useState, useEffect, useRef } from 'react';
import { Objeto } from '@/types';
import Input from '@/components/input';

interface ObjectSearchProps {
  objetosList: Objeto[];
  onObjectSelect: (objectId: string) => void;
  initialObjectName?: string;
  disabled?: boolean;
}

export default function ObjectSearch({
  objetosList,
  onObjectSelect,
  initialObjectName = '',
  disabled = false,
}: ObjectSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialObjectName);
  const [results, setResults] = useState<Objeto[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(initialObjectName);
  }, [initialObjectName]);
  
  // Filtrar resultados al escribir
  useEffect(() => {
    if (searchTerm.length > 1 && searchTerm !== initialObjectName) {
      const filtered = objetosList.filter(obj =>
        obj.Name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setResults(filtered.slice(0, 10)); // Mostrar solo los primeros 10 resultados
      setIsDropdownVisible(true);
    } else {
      setIsDropdownVisible(false);
    }
  }, [searchTerm, objetosList, initialObjectName]);

  // Cerrar el dropdown si se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchRef]);

  const handleSelect = (objeto: Objeto) => {
    setSearchTerm(objeto.Name);
    onObjectSelect(String(objeto.id));
    setIsDropdownVisible(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <Input
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => searchTerm.length > 1 && setIsDropdownVisible(true)}
        placeholder="Escribe para buscar un objeto..."
        disabled={disabled}
        autoComplete="off"
      />
      {isDropdownVisible && results.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-stone-300 rounded-lg shadow-lg max-h-60 overflow-y-auto scrollbar-custom">
          {results.map(obj => (
            <li
              key={obj.id}
              className="px-4 py-2 cursor-pointer hover:bg-bosque hover:text-white"
              onClick={() => handleSelect(obj)}
            >
              {obj.Name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}