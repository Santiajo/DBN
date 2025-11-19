'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DnDSubclass, SubclassFeature, SubclassResource } from '@/types';
import Button from "@/components/button"; 
import Modal from '@/components/modal';
import ConfirmAlert from '@/components/confirm-alert';
import FeatureForm from './feature-form';
import ResourceForm from './resource-form';
import { FaArrowLeft, FaPlus, FaPencilAlt, FaTrash } from 'react-icons/fa';

export default function SubclassDetailPage() {
  const { accessToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [subclass, setSubclass] = useState<DnDSubclass | null>(null);
  const [loading, setLoading] = useState(true);

  const [isFeatureModalOpen, setFeatureModalOpen] = useState(false);
  const [isResourceModalOpen, setResourceModalOpen] = useState(false);
  
  const [editingFeature, setEditingFeature] = useState<SubclassFeature | null>(null);
  const [editingResource, setEditingResource] = useState<SubclassResource | null>(null);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'feature' | 'resource', id: number } | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!accessToken || !slug) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subclasses/${slug}/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubclass(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, slug]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

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
          fetchDetail(); 
      } catch(e) { console.error(e); }
  }

  const handleDelete = async () => {
      if(!itemToDelete || !accessToken) return;
      const endpoint = itemToDelete.type === 'feature' ? 'subclass-features' : 'subclass-resources';
      try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${endpoint}/${itemToDelete.id}/`, {
             method: 'DELETE',
             headers: { 'Authorization': `Bearer ${accessToken}` } 
          });
          fetchDetail();
      } catch(e) { console.error(e); } 
      finally { setIsAlertOpen(false); }
  }

  // Helper para renderizar celda de recurso
  const renderResourceCell = (res: SubclassResource, level: number) => {
    const qty = res.progression?.[level];
    const val = res.value_progression?.[level];
    if (!qty && !val && res.quantity_type === 'Fixed') return <span className="text-stone-300">—</span>;

    return (
        <div className="flex flex-col items-center leading-tight">
            {res.quantity_type === 'Fixed' && qty && <span className="font-semibold">{qty}</span>}
            {res.quantity_type === 'Stat' && <span className="text-[10px] uppercase font-bold text-stone-500">{res.quantity_stat?.substring(0,3)} Mod</span>}
            {res.quantity_type === 'Proficiency' && <span className="text-[10px] uppercase font-bold text-stone-500">PB</span>}
            {val && <span className="text-xs text-bosque font-bold bg-bosque/10 px-1.5 rounded mt-0.5">{val}</span>}
        </div>
    );
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!subclass) return <div className="p-8">Subclase no encontrada</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-body text-stone-800">
      <div className="flex justify-between items-start">
        <Button variant="secondary" onClick={() => router.back()}>
            <div className="flex items-center gap-2"><FaArrowLeft /> Volver</div>
        </Button>
        <div className="text-right">
            <h1 className="text-3xl font-title text-stone-900 uppercase tracking-wide">{subclass.name}</h1>
            <p className="text-sm text-stone-500">{subclass.dnd_class_name}</p>
        </div>
      </div>

      <div className="flex gap-4 justify-end">
        <Button variant="primary" onClick={() => { setEditingFeature(null); setFeatureModalOpen(true); }}>
            <div className="flex items-center gap-2"><FaPlus /> Nuevo Rasgo</div>
        </Button>
        <Button variant="secondary" onClick={() => { setEditingResource(null); setResourceModalOpen(true); }}>
            <div className="flex items-center gap-2"><FaPlus /> Nuevo Recurso</div>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-madera-oscura shadow-lg">
        <table className="min-w-full text-left text-sm bg-white">
            <thead className="bg-cuero text-white font-title uppercase text-xs">
                <tr>
                    <th className="px-4 py-3 text-center w-16">Nivel</th>
                    <th className="px-4 py-3">Rasgos de Subclase</th>
                    {subclass.resources.map(res => (
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
                    const featuresAtLevel = subclass.features.filter(f => f.level === level);
                    
                    return (
                        <tr key={level} className="hover:bg-bosque/5 transition-colors odd:bg-white even:bg-stone-50">
                            <td className="px-4 py-3 text-center font-bold text-madera-oscura">{level}</td>
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
                            {subclass.resources.map(res => (
                                <td key={res.id} className="px-2 py-3 text-center text-stone-700 border-l border-stone-200">
                                    {renderResourceCell(res, level)}
                                </td>
                            ))}
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>

      <Modal isOpen={isFeatureModalOpen} onClose={() => setFeatureModalOpen(false)} title={editingFeature ? "Editar Rasgo" : "Nuevo Rasgo"}>
          <FeatureForm 
             onSave={(data) => { saveData('subclass-features', data, editingFeature?.id); setFeatureModalOpen(false); }} 
             onCancel={() => setFeatureModalOpen(false)} 
             onDelete={() => { setItemToDelete({type: 'feature', id: editingFeature!.id}); setFeatureModalOpen(false); setIsAlertOpen(true); }}
             initialData={editingFeature} 
             subclassId={subclass.id} 
          />
      </Modal>

      <Modal isOpen={isResourceModalOpen} onClose={() => setResourceModalOpen(false)} title={editingResource ? "Editar Recurso" : "Nuevo Recurso"}>
          <ResourceForm 
             onSave={(data) => { saveData('subclass-resources', data, editingResource?.id); setResourceModalOpen(false); }}
             onCancel={() => setResourceModalOpen(false)} 
             initialData={editingResource} 
             subclassId={subclass.id} 
          />
      </Modal>

      <ConfirmAlert 
         isOpen={isAlertOpen} 
         onClose={() => setIsAlertOpen(false)} 
         onConfirm={handleDelete} 
         title="Eliminar Elemento" 
         message="¿Estás seguro de eliminar este elemento?" 
      />
    </div>
  );
}