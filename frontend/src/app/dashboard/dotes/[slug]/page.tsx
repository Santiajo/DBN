'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DnDFeat, FeatFeature } from '@/types';
import Button from "@/components/button"; 
import Card from "@/components/card";     
import Modal from '@/components/modal';
import ConfirmAlert from '@/components/confirm-alert';
import FeatFeatureForm from './feature-form';
import { FaArrowLeft, FaPlus, FaPencilAlt, FaTrash } from 'react-icons/fa';

export default function FeatDetailPage() {
  const { accessToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [feat, setFeat] = useState<DnDFeat | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados CRUD de Beneficios (Features)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatFeature | null>(null);
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [featureToDelete, setFeatureToDelete] = useState<number | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!accessToken || !slug) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feats/${slug}/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFeat(data);
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  }, [accessToken, slug]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // --- Handlers ---

  const handleSaveFeature = async (data: Partial<FeatFeature>) => {
      if(!accessToken) return;
      const id = editingFeature?.id;
      const url = id 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/feat-features/${id}/`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/feat-features/`;
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
          setIsModalOpen(false);
          fetchDetail();
      } catch(e) { console.error(e); }
  };

  const handleDelete = async () => {
      if(!featureToDelete || !accessToken) return;
      try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feat-features/${featureToDelete}/`, {
             method: 'DELETE',
             headers: { 'Authorization': `Bearer ${accessToken}` } 
          });
          fetchDetail();
      } catch(e) { console.error(e); } 
      finally { setIsAlertOpen(false); }
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!feat) return <div className="p-8">Dote no encontrado</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 font-body text-stone-800">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <Button variant="secondary" onClick={() => router.back()}>
            <div className="flex items-center gap-2"><FaArrowLeft /> Volver</div>
        </Button>
      </div>

      {/* Tarjeta Principal del Dote */}
      <Card variant="primary">
        <div className="flex justify-between items-start mb-2">
            <h1 className="text-3xl font-title text-stone-900 uppercase">{feat.name}</h1>
            <span className="bg-white/40 px-3 py-1 rounded-full border border-madera-oscura/30 text-sm font-semibold">
                {feat.feat_type}
            </span>
        </div>
        
        {/* Prerrequisitos */}
        <div className="flex flex-wrap gap-2 text-xs text-stone-600 mb-4">
            {feat.prerequisite_level > 0 && <span className="bg-stone-200 px-2 py-1 rounded">Nivel {feat.prerequisite_level}+</span>}
            {feat.prerequisite_species_data && <span className="bg-stone-200 px-2 py-1 rounded">{feat.prerequisite_species_data.name}</span>}
            {feat.prerequisite_feat_name && <span className="bg-stone-200 px-2 py-1 rounded">Dote: {feat.prerequisite_feat_name}</span>}
            {feat.prerequisite_text && <span className="bg-stone-200 px-2 py-1 rounded">{feat.prerequisite_text}</span>}
            {feat.repeatable && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200">Repetible</span>}
        </div>

        <div className="font-body text-stone-800 space-y-4 border-t border-madera-oscura/20 pt-4">
            <p className="whitespace-pre-wrap italic text-stone-600">{feat.description}</p>
            
            {feat.ability_score_increase && (
                <div className="bg-bosque/10 p-3 rounded border border-bosque/20 text-sm">
                    <strong className="text-bosque block mb-1">Aumento de Característica:</strong>
                    {feat.ability_score_increase}
                </div>
            )}
        </div>
      </Card>

      {/* Sección de Beneficios */}
      <div className="flex justify-between items-center mt-8 mb-2">
        <h2 className="text-2xl font-title text-stone-800">Beneficios del Dote</h2>
        <Button variant="primary" onClick={() => { setEditingFeature(null); setIsModalOpen(true); }}>
            <div className="flex items-center gap-2"><FaPlus /> Nuevo Beneficio</div>
        </Button>
      </div>

      <div className="space-y-4">
        {feat.features.length === 0 && (
             <p className="text-stone-500 italic text-center py-8 bg-stone-50 rounded border border-stone-200 border-dashed">
                Este dote aún no tiene beneficios registrados.
             </p>
        )}

        {feat.features.map(feature => (
            <Card key={feature.id} variant="secondary" className="p-0 overflow-hidden">
                <div className="p-5 flex justify-between items-start">
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg text-bosque">{feature.name}</h3>
                        <p className="text-stone-700 whitespace-pre-wrap text-sm leading-relaxed">
                            {feature.description}
                        </p>
                    </div>
                    
                    {/* Botones de Acción */}
                    <div className="flex gap-2 ml-4 shrink-0">
                        <button 
                            onClick={() => { setEditingFeature(feature); setIsModalOpen(true); }}
                            className="p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 rounded transition-colors"
                            title="Editar"
                        >
                            <FaPencilAlt />
                        </button>
                        <button 
                            onClick={() => { setFeatureToDelete(feature.id); setIsAlertOpen(true); }}
                            className="p-2 text-red-300 hover:bg-red-50 hover:text-carmesi rounded transition-colors"
                            title="Eliminar"
                        >
                            <FaTrash />
                        </button>
                    </div>
                </div>
            </Card>
        ))}
      </div>

      {/* Modal Formulario */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingFeature ? "Editar Beneficio" : "Nuevo Beneficio"}>
          <FeatFeatureForm 
             onSave={handleSaveFeature} 
             onCancel={() => setIsModalOpen(false)} 
             onDelete={() => { 
                 if(editingFeature) {
                     setFeatureToDelete(editingFeature.id);
                     setIsModalOpen(false);
                     setIsAlertOpen(true);
                 }
             }}
             initialData={editingFeature} 
             featId={feat.id} 
          />
      </Modal>

      {/* Confirmación de Borrado */}
      <ConfirmAlert 
         isOpen={isAlertOpen} 
         onClose={() => setIsAlertOpen(false)} 
         onConfirm={handleDelete} 
         title="Eliminar Beneficio" 
         message="¿Estás seguro? Esta acción no se puede deshacer." 
      />
    </div>
  );
}