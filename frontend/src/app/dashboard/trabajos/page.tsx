'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Card from "@/components/card";
import Table from "@/components/table";
import Input from "@/components/input";
import Button from "@/components/button";
import Pagination from '@/components/pagination';
import Modal from '@/components/modal';
import TrabajoForm from './trabajo-form';
import TrabajarForm from './trabajar-form';
import ConfirmAlert from '@/components/confirm-alert';
import { FaSearch, FaTrash, FaPencilAlt, FaEye, FaHammer } from 'react-icons/fa';
import { Trabajo, Habilidad, PagoRango, Personaje, Proficiencia, BonusProficiencia } from '@/types';




// Función helper para normalizar URLs
const buildApiUrl = (endpoint: string) => {
  const baseUrl = 'https://dbn.onrender.com'; // ← Hardcodeado
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/api/${normalizedEndpoint}`; // ← Incluir /api/
};

console.log('🔍 URLs que se generarán:', {
  trabajos: buildApiUrl('trabajos/'),
  pagos: buildApiUrl('trabajos/1/pagos/'),
  habilidades: buildApiUrl('habilidades/')
});

export default function TrabajosPage() {
    const { user, accessToken, logout } = useAuth();
    const router = useRouter();

    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // --- ESTADO PARA ADMINS ---
    const [habilidades, setHabilidades] = useState<Habilidad[]>([]);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [editingTrabajo, setEditingTrabajo] = useState<Trabajo | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    
    // --- ESTADO NUEVO PARA USUARIOS NORMALES ---
    const [personajes, setPersonajes] = useState<Personaje[]>([]);
    const [proficiencias, setProficiencias] = useState<Proficiencia[]>([]);
    const [bonusTabla, setBonusTabla] = useState<BonusProficiencia[]>([]);
    const [isTrabajarModalOpen, setIsTrabajarModalOpen] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);


    // Fetch trabajos 
const fetchTrabajos = useCallback(async (page = 1, searchQuery = '') => {
    if (!accessToken) return;  // verifica el token, no si es staff
    
    const params = new URLSearchParams({
      page: String(page),
      search: searchQuery,
    });
    
    const url = buildApiUrl(`trabajos/?${params.toString()}`);
    
    try {
      const res = await fetch(url, { 
        headers: { 'Authorization': `Bearer ${accessToken}` } 
      });
      
      if (!res.ok) {
        if (res.status === 401) logout();
        throw new Error('Error al cargar los datos');
      }
      
      const data = await res.json();
      const trabajosData = data.results || data;
      
      // CARGAR PAGOS PARA CADA TRABAJO - PERO SOLO SI ES STAFF
      const trabajosConPagos = await Promise.all(
        trabajosData.map(async (trabajo: Trabajo) => {
          // Si no es staff, no cargar los pagos (para optimizar)
          if (!user?.is_staff) {
            trabajo.pagos = []; // Array vacío para usuarios normales
            return trabajo;
          }
          
          try {
            const pagosRes = await fetch(
              buildApiUrl(`trabajos/${trabajo.id}/pagos/`), 
              { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            
            if (pagosRes.ok) {
              const pagosData = await pagosRes.json();
              trabajo.pagos = pagosData.results || pagosData || [];
              console.log(`✅ Cargados ${trabajo.pagos?.length || 0} pagos para trabajo ${trabajo.nombre}`);
            } else {
              console.log(`❌ Error cargando pagos para trabajo ${trabajo.id}:`, pagosRes.status);
              trabajo.pagos = [];
            }
          } catch (error) {
            console.error(`Error cargando pagos para trabajo ${trabajo.id}:`, error);
            trabajo.pagos = [];
          }
          return trabajo;
        })
      );
      
      setTrabajos(trabajosConPagos);
      setTotalPages(Math.ceil(data.count / 12));
      setCurrentPage(page);
    
      if (trabajosConPagos.length > 0 && !selectedTrabajo) {
        setSelectedTrabajo(trabajosConPagos[0]);
      } else if (trabajosConPagos.length === 0) {
        setSelectedTrabajo(null);
      }
    } catch (error) {
      console.error('Error fetching trabajos:', error);
    }
}, [accessToken, logout, selectedTrabajo, user?.is_staff]);

    // Fetch habilidades
    const fetchHabilidades = useCallback(async () => {
        if (!accessToken) return;
        
        // 👇 CORREGIDO: Quitar /api/
        const url = buildApiUrl('habilidades/');
        console.log('🌐 URL fetchHabilidades:', url);
        
        try {
             const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (res.ok) {
                const data = await res.json();
                setHabilidades(data.results || data);
            }
        } catch (error) {
            console.error('Error fetching habilidades:', error);
        }
    }, [accessToken]);

    // --- FETCH NUEVOS PARA EL MODAL DE "TRABAJAR" ---

    const fetchPersonajes = useCallback(async () => {
        if (!accessToken) return;
        const url = buildApiUrl('personajes/');
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (res.ok) {
                const data = await res.json();
                setPersonajes(data.results || data);
            }
        } catch (error) { console.error('Error fetching personajes:', error); }
    }, [accessToken]);

    const fetchProficiencias = useCallback(async () => {
        if (!accessToken) return;
        // Obtenemos TODAS las proficiencias del usuario (para todos sus personajes)
        const url = buildApiUrl('proficiencias/'); 
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (res.ok) {
                const data = await res.json();
                setProficiencias(data.results || data);
            }
        } catch (error) { console.error('Error fetching proficiencias:', error); }
    }, [accessToken]);

    const fetchBonus = useCallback(async () => {
        if (!accessToken) return;
        const url = buildApiUrl('bonusproficiencias/');
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (res.ok) {
                const data = await res.json();
                setBonusTabla(data.results || data);
            }
        } catch (error) { console.error('Error fetching bonus:', error); }
    }, [accessToken]);

    useEffect(() => {
        if (user) {
            fetchTrabajos(currentPage, searchTerm);
            
            if (user.is_staff) {
                // El Admin necesita Habilidades para crear trabajos
                fetchHabilidades();
            } else {
                // El Usuario Normal necesita sus datos para trabajar
                fetchPersonajes();
                fetchProficiencias();
                fetchBonus();
            }
        }
    }, [user, currentPage, fetchTrabajos, fetchHabilidades, fetchPersonajes, fetchProficiencias, fetchBonus, searchTerm]);

    const handleSearch = () => { fetchTrabajos(1, searchTerm); };
    const handlePageChange = (newPage: number) => { fetchTrabajos(newPage, searchTerm); };

    const handleOpenCreateModal = () => {
        if (!user?.is_staff) return;
        setEditingTrabajo(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (trabajo: Trabajo) => {
        if (!user?.is_staff) return;
        setEditingTrabajo(trabajo);
        setIsModalOpen(true);
    };
    const handleOpenTrabajarModal = () => {
        if (!selectedTrabajo) return;
        setIsTrabajarModalOpen(true);
    };

    const handleWorkSuccess = () => {

        setIsTrabajarModalOpen(false);
        fetchPersonajes(); 
        // se podria mostrar un toast/alerta de "¡Trabajo completado!"
    };

const handleSaveTrabajo = async (trabajoData: Trabajo) => {
  console.log('💾 Datos completos del trabajo:', trabajoData);
  
  if (!accessToken) return;
  
  const isEditing = !!trabajoData.id;
  
  try {
    // PRIMERO: Crear o actualizar el trabajo
    const trabajoUrl = isEditing 
      ? buildApiUrl(`trabajos/${trabajoData.id}/`)
      : buildApiUrl('trabajos/');
    
    const trabajoMethod = isEditing ? 'PUT' : 'POST';

    const { pagos, ...datosTrabajo } = trabajoData;
    
    const trabajoRes = await fetch(trabajoUrl, {
      method: trabajoMethod,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(datosTrabajo),
    });
    
    if (!trabajoRes.ok) {
      const errorData = await trabajoRes.json();
      throw new Error(`Error al ${isEditing ? 'actualizar' : 'crear'} el trabajo: ${JSON.stringify(errorData)}`);
    }
    
    const trabajoGuardado = await trabajoRes.json();
    console.log('✅ Trabajo guardado:', trabajoGuardado);
    
    // SEGUNDO: Manejar los pagos - CORREGIDO
    if (pagos && pagos.length > 0) {
      console.log('💾 Procesando pagos para trabajo ID:', trabajoGuardado.id);
      
      // Para edición: primero obtener pagos existentes
      let pagosExistentes: PagoRango[] = [];
      if (isEditing) {
        try {
          const pagosRes = await fetch(buildApiUrl(`trabajos/${trabajoGuardado.id}/pagos/`), {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });
          if (pagosRes.ok) {
            const pagosData = await pagosRes.json();
            console.log('📋 Respuesta completa de pagos:', pagosData);
            
            // 👇 CORRECCIÓN: Extraer el array correctamente
            pagosExistentes = pagosData.results || pagosData.data || pagosData || [];
            console.log('📋 Pagos existentes extraídos:', pagosExistentes);
            
            // Validar que sea un array
            if (!Array.isArray(pagosExistentes)) {
              console.error('❌ Los pagos existentes no son un array:', typeof pagosExistentes);
              pagosExistentes = [];
            }
          }
        } catch (error) {
          console.error('Error obteniendo pagos existentes:', error);
        }
      }
      
      const promesasPagos = pagos.map(async (pago) => {
        const pagoData = {
          trabajo: trabajoGuardado.id,
          rango: pago.rango,
          valor_suma: pago.valor_suma,
          multiplicador: pago.multiplicador,
        };
        
        // Verificar si ya existe un pago para este rango - CON VALIDACIÓN
        const pagoExistente = Array.isArray(pagosExistentes) 
          ? pagosExistentes.find((p: PagoRango) => p.rango === pago.rango)
          : undefined;
        
        let urlPago, methodPago;
        
        if (pagoExistente && pagoExistente.id && isEditing) {
          // ACTUALIZAR pago existente
          urlPago = buildApiUrl(`pagos-rango/${pagoExistente.id}/`);
          methodPago = 'PUT';
          console.log(`🔄 Actualizando pago rango ${pago.rango} (ID: ${pagoExistente.id})`);
        } else {
          // CREAR nuevo pago
          urlPago = buildApiUrl(`trabajos/${trabajoGuardado.id}/pagos/`);
          methodPago = 'POST';
          console.log(`🆕 Creando pago rango ${pago.rango}`);
        }
        
        console.log(`📤 Enviando pago rango ${pago.rango}:`, pagoData);
        // Después de obtener los pagos existentes
        console.log('🔍 DEBUG - Tipo de pagosExistentes:', typeof pagosExistentes);
        console.log('🔍 DEBUG - Es array?:', Array.isArray(pagosExistentes));
        console.log('🔍 DEBUG - Contenido:', pagosExistentes);
        
        const response = await fetch(urlPago, {
          method: methodPago,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(pagoData),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Error en pago rango ${pago.rango}:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`Error en pago rango ${pago.rango}: ${errorText}`);
        }
        
        return response;
      });
      
      const resultados = await Promise.allSettled(promesasPagos);
      
      const exitosos = resultados.filter(r => r.status === 'fulfilled').length;
      const fallidos = resultados.filter(r => r.status === 'rejected').length;
      
      console.log(`📊 Resultados pagos: ${exitosos} exitosos, ${fallidos} fallidos`);
      
      resultados.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`❌ Falló pago rango ${pagos[index].rango}:`, result.reason);
        }
      });
      
      if (fallidos > 0) {
        throw new Error(`${fallidos} pagos no se pudieron guardar`);
      }
    }
    
    setIsModalOpen(false);
    setEditingTrabajo(null);
    fetchTrabajos(currentPage, '');
    
  } catch (error) {
    console.error('❌ Error completo:', error);
    alert('Error al guardar: ' + error);
  }
};

// Handle para eliminar trabajos

    const handleDelete = async () => {
        if (!selectedTrabajo) return;
        setIsAlertOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedTrabajo || !accessToken) return;

        const url = buildApiUrl(`trabajos/${selectedTrabajo.id}/`);
        try {
            const res = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

            if (!res.ok) throw new Error('Error al eliminar el trabajo');

            if (trabajos.length === 1 && currentPage > 1) {
                fetchTrabajos(currentPage - 1, searchTerm);
            } else {
                fetchTrabajos(currentPage, searchTerm);
            }

            setSelectedTrabajo(null);

        } catch (error) {
            console.error('Error al eliminar el trabajo:', error);
        } finally {
            setIsAlertOpen(false);
        }
    };

    // HEADERS ESPECÍFICOS PARA TRABAJOS
    const tableHeaders = [
        { key: 'nombre', label: 'Nombre' },
        { key: 'requisito_habilidad_nombre', label: 'Habilidad Requerida' },
        { key: 'rango_maximo', label: 'Rango Máx' },
    ];

    if (!user) {
    return <div className="p-8 font-title">Verificando acceso...</div>;
}
    return (
        <div className="p-8 space-y-6">
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTrabajo ? "Editar Trabajo" : "Crear Nuevo Trabajo"}
            >
                <TrabajoForm
                    onSave={handleSaveTrabajo}
                    onCancel={() => setIsModalOpen(false)}
                    initialData={editingTrabajo}
                    habilidades={habilidades}
                />
            </Modal>

            {selectedTrabajo && (
                <Modal
                    isOpen={isTrabajarModalOpen}
                    onClose={() => setIsTrabajarModalOpen(false)}
                    title={`Trabajar como: ${selectedTrabajo.nombre}`}
                >
                    <TrabajarForm
                        trabajo={selectedTrabajo}
                        personajes={personajes}
                        proficiencias={proficiencias}
                        bonusTabla={bonusTabla}
                        accessToken={accessToken!}
                        onClose={() => setIsTrabajarModalOpen(false)}
                        onWorkSuccess={handleWorkSuccess}
                    />
                </Modal>
            )}

            <ConfirmAlert
                isOpen={isAlertOpen}
                onClose={() => setIsAlertOpen(false)}
                onConfirm={handleConfirmDelete}
                title="¿ESTÁS SEGURO?"
                message={`Esta acción no se puede deshacer. El trabajo "${selectedTrabajo?.nombre}" se eliminará permanentemente.`}
            />

            {/* CREAR Y BUSCAR - IDÉNTICO A OBJETOS */}
            {user?.is_staff && (
                <div className="flex justify-end items-center gap-4">
                    <Button variant="primary" onClick={handleOpenCreateModal}>
                        Crear Trabajo
                    </Button>
                    <div className="flex items-center gap-2 flex-grow max-w-xs">
                        <Input
                            placeholder="Buscar por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button variant="secondary" onClick={handleSearch}>
                            <FaSearch />
                        </Button>
                    </div>
                </div>
            )}

            {/* TABLA Y DESCRIPCIÓN - ESTRUCTURA IDÉNTICA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <Table 
                        data={trabajos} 
                        headers={tableHeaders} 
                        onRowClick={(trabajo) => setSelectedTrabajo(trabajo as Trabajo)} 
                    />
                    <Pagination 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPageChange={handlePageChange} 
                    />
                </div>

                <div className="lg:col-span-1">
                {selectedTrabajo ? (
                    <Card variant="primary" className="h-full flex flex-col">
                    <div>
                        <h3 className="font-title text-xl text-madera-oscura">{selectedTrabajo.nombre}</h3>
                        <p className="font-body text-xs italic text-stone-600">
                        Habilidad: {selectedTrabajo.requisito_habilidad_nombre || 'N/A'} | 
                        Rango Máx: {selectedTrabajo.rango_maximo}
                        </p>
                    </div>
                    
                    <div className="font-body text-sm flex-grow mt-4 border-t pt-4 border-madera-oscura">
                        {/* DESCRIPCIÓN DEL TRABAJO */}
                        {selectedTrabajo.descripcion && (
                        <div className="mb-4">
                            <p className="font-semibold text-madera-oscura mb-1">Descripción:</p>
                            <p className="text-stone-700">{selectedTrabajo.descripcion}</p>
                        </div>
                        )}
                        
                        {/* PAGOS POR RANGO - SOLO PARA STAFF */}
                            <div className="mb-4">
                                <p className="font-semibold text-madera-oscura mb-2">Pagos por Día:</p>
                                <div className="space-y-2">
                                    {selectedTrabajo.pagos && selectedTrabajo.pagos.length > 0 ? (
                                        selectedTrabajo.pagos
                                            .sort((a, b) => a.rango - b.rango)
                                            .map((pago) => (
                                                <div 
                                                    key={pago.rango} 
                                                    className="flex items-center justify-between p-2 bg-pergamino/50 rounded-lg border border-madera-oscura/20"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-madera-oscura min-w-12">Rango {pago.rango}</span>
                                                        <div className="text-xs font-mono bg-white/80 px-2 py-1 rounded border">
                                                            ({pago.valor_suma} + Eco) × {pago.multiplicador}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-stone-500 text-right">
                                                        <div>Suma: {pago.valor_suma}</div>
                                                        <div>Mult: {pago.multiplicador}</div>
                                                    </div>
                                                </div>
                                            ))
                                    ) : (
                                        <p className="text-stone-500 text-sm italic">No hay pagos configurados</p>
                                    )}
                                </div>
                            </div>

                        {/* BENEFICIO DEL TRABAJO */}
                        {selectedTrabajo.beneficio && (
                        <div>
                            <p className="font-semibold text-madera-oscura mb-1">Beneficio:</p>
                            <p className="text-stone-700">{selectedTrabajo.beneficio}</p>
                        </div>
                        )}
                    </div>
                    
                    {/* BOTONES DE ACCIÓN */}
                       {user.is_staff ? (
                                    // --- BOTONES DE ADMIN ---
                                    <>
                                        <Button variant="dangerous" onClick={handleDelete}>
                                            <FaTrash />
                                        </Button>
                                        <Button variant="secondary" onClick={() => handleOpenEditModal(selectedTrabajo)}>
                                            <FaPencilAlt />
                                        </Button>
                                    </>
                                ) : (
                                    // --- BOTÓN DE USUARIO NORMAL ---
                                    <Button 
                                        variant="primary" 
                                        onClick={handleOpenTrabajarModal} 
                                        className="w-full"
                                    >
                                        <FaHammer className="mr-2" />
                                        Trabajar
                                    </Button>
                                )}
                    </Card>
                ) : (
                    <Card variant="primary" className="h-full flex items-center justify-center">
                        <p className="text-stone-500">Selecciona un trabajo para ver los detalles</p>
                    </Card>
                    )}
                </div>
            </div>
        </div>
    );
}