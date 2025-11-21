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
import { FaArrowLeft, FaPlus, FaPencilAlt, FaTrash, FaIndent } from 'react-icons/fa';

export default function FeatDetailPage() {
  const { accessToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [feat, setFeat] = useState<DnDFeat | null>(null);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatFeature | null>(null);
  const [parentForNewFeature, setParentForNewFeature] = useState<number | null>(null); // Nuevo estado
  
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

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  // Handlers
  const handleOpenCreate = (parentId: number | null = null) => {
      setEditingFeature(null);
      setParentForNewFeature(parentId);
      setIsModalOpen(true);
  };

  const handleOpenEdit = (feature: FeatFeature) => {
      setEditingFeature(feature);
      setParentForNewFeature(null);
      setIsModalOpen(true);
  };

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
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
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
             method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } 
          });
          fetchDetail();
      } catch(e) { console.error(e); } 
      finally { setIsAlertOpen(false); }
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!feat) return <div className="p-8">Dote no encontrado</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 font-body text-stone-800">
      {/* Header y Tarjeta Principal (Igual que antes) */}
      <div className="flex justify-between items-start">
        <Button variant="primary" onClick={() => router.back()}><div className="flex items-center gap-2"><FaArrowLeft /> Volver</div></Button>
      </div>
      <Card variant="secondary">
        <div className="flex justify-between items-start mb-2">
            <h1 className="text-3xl font-title text-stone-900 uppercase">{feat.name}</h1>
            <span className="bg-white/40 px-3 py-1 rounded-full border border-madera-oscura/30 text-sm font-semibold">{feat.feat_type}</span>
        </div>
        {/* ... Resto de metadatos (Prerrequisitos, ASI) ... */}
        <div className="font-body text-stone-800 space-y-4 border-t border-madera-oscura/20 pt-4 mt-2">
             <p className="whitespace-pre-wrap italic text-stone-600">{feat.description}</p>
             {feat.ability_score_increase && (
                <div className="bg-bosque/10 p-3 rounded border border-bosque/20 text-sm">
                    <strong className="text-bosque block mb-1">Aumento de Característica:</strong>
                    {feat.ability_score_increase}
                </div>
            )}
        </div>
      </Card>

      <div className="flex justify-between items-center mt-8 mb-2">
        <h2 className="text-2xl font-title text-stone-800">Beneficios del Dote</h2>
        <Button variant="primary" onClick={() => handleOpenCreate(null)}>
            <div className="flex items-center gap-2"><FaPlus /> Nuevo Beneficio</div>
        </Button>
      </div>

      <div className="space-y-4">
        {feat.features.map(feature => (
            <Card key={feature.id} variant="secondary" className="p-0 overflow-hidden">
                {/* Rasgo Padre */}
                <div className="p-5 flex justify-between items-start bg-stone-50/50">
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-bosque">{feature.name}</h3>
                            {feature.choices_count > 0 && (
                                <span className="text-xs font-medium bg-cuero/10 text-cuero px-2 py-0.5 rounded border border-cuero/40">
                                    Elige {feature.choices_count}
                                </span>
                            )}
                        </div>
                        <p className="text-stone-700 whitespace-pre-wrap text-sm leading-relaxed">{feature.description}</p>
                    </div>
                    
                    <div className="flex gap-2 ml-4 shrink-0">
                        {/* Botón Añadir Opción (Solo si es padre) */}
                        <button 
                            onClick={() => handleOpenCreate(feature.id)}
                            className="p-2 items-center gap-1 text-madera-oscura hover:bg-madera-oscura/10 rounded tooltip transition-colors"
                            title="Añadir Opción"
                        >
                            <FaIndent /> <FaPlus className="inline w-2.5 h-2.5 ml-1"/>
                        </button>
                        <button onClick={() => handleOpenEdit(feature)} className="p-2 text-stone-500 hover:bg-stone-200 rounded"><FaPencilAlt /></button>
                        <button onClick={() => { setFeatureToDelete(feature.id); setIsAlertOpen(true); }} className="p-2 text-carmesi hover:bg-carmesi/10 rounded"><FaTrash /></button>
                    </div>
                </div>

                {/* Lista de Opciones (Hijos) */}
                {feature.options && feature.options.length > 0 && (
                    <div className="border-t border-stone-200 bg-white pl-8 pr-4 py-4 space-y-3">
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">Opciones Disponibles:</p>
                        {feature.options.map(option => (
                            <div key={option.id} className="flex justify-between items-start p-3 border border-stone-100 rounded hover:border-stone-300 transition-colors bg-stone-50/30">
                                <div>
                                    <h4 className="font-semibold text-sm text-stone-800">{option.name}</h4>
                                    <p className="text-xs text-stone-600 mt-1">{option.description}</p>
                                </div>
                                <div className="flex gap-1 ml-2">
                                    <button onClick={() => handleOpenEdit(option)} className="p-1.5 text-stone-400 hover:text-stone-700"><FaPencilAlt className="w-3 h-3"/></button>
                                    <button onClick={() => { setFeatureToDelete(option.id); setIsAlertOpen(true); }} className="p-1.5 text-carmesi hover:bg-carmesi/10 rounded"><FaTrash className="w-3 h-3"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingFeature ? "Editar Beneficio" : (parentForNewFeature ? "Nueva Opción" : "Nuevo Beneficio")}>
          <FeatFeatureForm 
             onSave={handleSaveFeature} 
             onCancel={() => setIsModalOpen(false)} 
             onDelete={() => { if(editingFeature) { setFeatureToDelete(editingFeature.id); setIsModalOpen(false); setIsAlertOpen(true); }}}
             initialData={editingFeature} 
             featId={feat.id}
             parentId={parentForNewFeature}
          />
      </Modal>

      <ConfirmAlert isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} onConfirm={handleDelete} title="Eliminar Beneficio" message="¿Estás seguro? Se borrarán también las opciones anidadas." />
    </div>
  );
}