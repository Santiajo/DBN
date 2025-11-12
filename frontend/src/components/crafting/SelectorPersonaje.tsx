'use client';

import Select, { StylesConfig, CSSObjectWithLabel } from 'react-select';

interface Personaje {
  id: number;
  nombre_personaje: string;
  oro: number;
  tiempo_libre: number;
  nivel: number;
}

interface SelectOption {
  value: number;
  label: string;
}

interface Props {
  personajes: Personaje[];
  personajeSeleccionado: Personaje | null;
  onSeleccionar: (personaje: Personaje | null) => void;
}

const customSelectStyles: StylesConfig<SelectOption, false> = {
  control: (base: CSSObjectWithLabel) => ({
    ...base,
    borderColor: '#78716c', // stone-500
    minWidth: '250px',
    boxShadow: 'none',
    '&:hover': { borderColor: '#57534e' }, // stone-600
  }),
  option: (base: CSSObjectWithLabel, state) => ({
    ...base,
    backgroundColor: state.isFocused ? '#f5f5f4' : 'white', // stone-100
    color: '#1c1917', // stone-900
    cursor: 'pointer',
  }),
  singleValue: (base: CSSObjectWithLabel) => ({
    ...base,
    color: '#1c1917', // stone-900
  }),
};

export default function SelectorPersonaje({ personajes, personajeSeleccionado, onSeleccionar }: Props) {
  const options: SelectOption[] = personajes.map(p => ({
    value: p.id,
    label: `${p.nombre_personaje} (Nv. ${p.nivel})`
  }));

  const handleChange = (option: SelectOption | null) => {
    if (option) {
      const personaje = personajes.find(p => p.id === option.value);
      onSeleccionar(personaje || null);
    } else {
      onSeleccionar(null);
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-stone-700 mb-1">
        Personaje
      </label>
      <Select<SelectOption, false>
        options={options}
        value={personajeSeleccionado ? {
          value: personajeSeleccionado.id,
          label: `${personajeSeleccionado.nombre_personaje} (Nv. ${personajeSeleccionado.nivel})`
        } : null}
        onChange={handleChange}
        isClearable
        placeholder="Selecciona un personaje..."
        styles={customSelectStyles}
        className="font-body"
      />
    </div>
  );
}