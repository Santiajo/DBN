'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DnDClass, ClassFeature, ClassResource } from '@/types';
import Button from "@/components/button"; 
import Card from "@/components/card";     
import Modal from '@/components/modal';
import ConfirmAlert from '@/components/confirm-alert';
import FeatureForm from './feature-form';
import ResourceForm from './resource-form';
import { FaArrowLeft, FaPlus, FaPencilAlt, FaTrash, FaBolt, FaScroll } from 'react-icons/fa';

// Función auxiliar para calcular el bono de competencia
const getProficiencyBonus = (level: number) => Math.ceil(level / 4) + 1;

export default function ClassDetailPage() {
  const { accessToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [dndClass, setDnDClass] = useState<DnDClass | null>(null);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isFeatureModalOpen, setFeatureModalOpen] = useState(false);
  const [isResourceModalOpen, setResourceModalOpen] = useState(false);
  
  const [editingFeature, setEditingFeature] = useState<ClassFeature | null>(null);
  const [editingResource, setEditingResource] = useState<ClassResource | null>(null);

  // Alertas
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'feature' | 'resource', id: number } | null>(null);

  const fetchClassDetail = useCallback(async () => {
    if (!accessToken || !slug) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/${slug}/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDnDClass(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, slug]);

  useEffect(() => {
    fetchClassDetail();
  }, [fetchClassDetail]);

  // --- GUARDAR DATOS ---
  
  const handleSaveFeature = async (data: Partial<ClassFeature>) => {
      await saveData('class-features', data, editingFeature?.id);
      setFeatureModalOpen(false);
  };

  const handleSaveResource = async (data: Partial<ClassResource>) => {
      await saveData('class-resources', data, editingResource?.id);
      setResourceModalOpen(false);
  };

  const saveData = async (endpoint: string, data: any, id?: number) => {
      if(!accessToken) return;
      const url = id 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/${endpoint}/${id}/`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/${endpoint}/`;
      
      const method = id ? 'PUT' : 'POST';
      
      try {
          await fetch(url, {
              method,
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify(data)
          });
          fetchClassDetail(); // Recargar todo
      } catch(e) {
          console.error(e);
      }
  }

  // --- BORRAR DATOS ---
  const handleDelete = async () => {
      if(!itemToDelete || !accessToken) return;
      const endpoint = itemToDelete.type === 'feature' ? 'class-features' : 'class-resources';
      try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${endpoint}/${itemToDelete.id}/`, {
             method: 'DELETE',
             headers: { 'Authorization': `Bearer ${accessToken}` } 
          });
          fetchClassDetail();
      } catch(e) {
          console.error(e);
      } finally {
          setIsAlertOpen(false);
      }
  }

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!dndClass) return <div className="p-8">Clase no encontrada</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-body text-stone-800">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <Button variant="secondary" onClick={() => router.back()}>
            <div className="flex items-center gap-2"><FaArrowLeft /> Volver</div>
        </Button>
        <h1 className="text-3xl font-title text-stone-900 uppercase tracking-wide">{dndClass.name}</h1>
      </div>

      {/* Panel de Acciones */}
      <div className="flex gap-4 justify-end">
        <Button variant="primary" onClick={() => { setEditingFeature(null); setFeatureModalOpen(true); }}>
            <div className="flex items-center gap-2"><FaPlus /> Nuevo Rasgo (Feature)</div>
        </Button>
        <Button variant="secondary" onClick={() => { setEditingResource(null); setResourceModalOpen(true); }}>
            <div className="flex items-center gap-2"><FaPlus /> Nuevo Recurso</div>
        </Button>
      </div>

      {/* TABLA DE PROGRESIÓN */}
      <div className="overflow-x-auto rounded-xl border border-madera-oscura shadow-lg">
        <table className="min-w-full text-left text-sm bg-white">
            <thead className="bg-cuero text-white font-title uppercase text-xs">
                <tr>
                    <th className="px-4 py-3 text-center w-16">Nivel</th>
                    <th className="px-4 py-3 text-center w-24">Bono Comp.</th>
                    <th className="px-4 py-3">Rasgos de Clase</th>
                    
                    {/* Columnas Dinámicas de Recursos */}
                    {dndClass.resources.map(res => (
                        <th key={res.id} className="px-2 py-3 text-center w-24 border-l border-white/20 group relative">
                            <div className="flex flex-col items-center cursor-pointer hover:text-pergamino" 
                                 onClick={() => { setEditingResource(res); setResourceModalOpen(true); }}>
                                <span>{res.name}</span>
                                <span className="text-[9px] opacity-70 normal-case">({res.reset_on})</span>
                            </div>
                             <button 
                                onClick={(e) => { e.stopPropagation(); setItemToDelete({type: 'resource', id: res.id}); setIsAlertOpen(true); }}
                                className="absolute top-1 right-1 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                             >
                                 <FaTrash className="w-3 h-3" />
                             </button>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
                {Array.from({ length: 20 }, (_, i) => i + 1).map(level => {
                    const featuresAtLevel = dndClass.features.filter(f => f.level === level);
                    
                    return (
                        <tr key={level} className="hover:bg-bosque/5 transition-colors odd:bg-white even:bg-stone-50">
                            {/* Nivel */}
                            <td className="px-4 py-3 text-center font-bold text-madera-oscura">{level}</td>
                            
                            {/* Bono Competencia */}
                            <td className="px-4 py-3 text-center text-stone-600">+{getProficiencyBonus(level)}</td>
                            
                            {/* Features */}
                            <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                    {featuresAtLevel.length === 0 && <span className="text-stone-300 text-xs">-</span>}
                                    {featuresAtLevel.map(feat => (
                                        <span 
                                            key={feat.id} 
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-stone-300 text-xs font-semibold text-stone-700 cursor-pointer hover:border-bosque hover:text-bosque transition"
                                            onClick={() => { setEditingFeature(feat); setFeatureModalOpen(true); }}
                                        >
                                            {feat.name}
                                            <FaPencilAlt className="w-2 h-2 opacity-50" />
                                        </span>
                                    ))}
                                </div>
                            </td>

                            {/* Recursos Dinámicos */}
                            {dndClass.resources.map(res => (
                                <td key={res.id} className="px-2 py-3 text-center text-stone-700 border-l border-stone-200">
                                    {res.progression[level] || '—'}
                                </td>
                            ))}
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>

      {/* Modales */}
      <Modal isOpen={isFeatureModalOpen} onClose={() => setFeatureModalOpen(false)} title={editingFeature ? "Editar Rasgo" : "Nuevo Rasgo"}>
          <FeatureForm 
             onSave={handleSaveFeature} 
             onCancel={() => setFeatureModalOpen(false)} 
             initialData={editingFeature} 
             classId={dndClass.id} 
          />
      </Modal>

      <Modal isOpen={isResourceModalOpen} onClose={() => setResourceModalOpen(false)} title={editingResource ? "Editar Recurso" : "Nuevo Recurso"}>
          <ResourceForm 
             onSave={handleSaveResource} 
             onCancel={() => setResourceModalOpen(false)} 
             initialData={editingResource} 
             classId={dndClass.id} 
          />
      </Modal>

      <ConfirmAlert 
         isOpen={isAlertOpen} 
         onClose={() => setIsAlertOpen(false)} 
         onConfirm={handleDelete} 
         title="Eliminar Elemento" 
         message="¿Estás seguro de eliminar este elemento? Esta acción no se puede deshacer." 
      />
    </div>
  );
}