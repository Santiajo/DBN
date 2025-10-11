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

const MAX_RESULTS = 20; 

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
    // Sincroniza el término de búsqueda si el nombre inicial cambia
    setSearchTerm(initialObjectName);
  }, [initialObjectName]);
  
  useEffect(() => {
    if (!isDropdownVisible) return;

    if (searchTerm.length > 0) {
      // Si hay texto, filtrar la lista completa
      const filtered = objetosList.filter(obj =>
        obj.Name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setResults(filtered.slice(0, MAX_RESULTS));
    } else {
      // Si no hay texto (campo vacío), mostrar los primeros N objetos de la lista
      setResults(objetosList.slice(0, MAX_RESULTS));
    }
  }, [searchTerm, objetosList, isDropdownVisible]);

  // Manejar clics fuera del componente para cerrar el dropdown
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
        onFocus={() => setIsDropdownVisible(true)}
        placeholder="Busca un objeto..."
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