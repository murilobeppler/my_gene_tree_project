import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Edit2, Save, XCircle, Heart } from 'lucide-react';
import { Person } from '@/types/family';
import MediaGallery from './MediaGallery';
import { updatePerson, uploadMedia, api } from '@/services/api';

interface ProfileDrawerProps {
    person: Person | null;
    isOpen: boolean;
    onClose: () => void;
}

const ProfileDrawer = ({ person, isOpen, onClose }: ProfileDrawerProps) => {
    const [activeTab, setActiveTab] = useState<'bio' | 'media'>('bio');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Person>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Estado para dados reais e mídia
    const [currentPerson, setCurrentPerson] = useState<Person | null>(null);
    const [mediaItems, setMediaItems] = useState<any[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form e carregar dados reais da API quando a pessoa mudar
    useEffect(() => {
        if (person) {
            // Inicializa com props mockadas/cacheadas para feedback instantâneo
            setCurrentPerson(person);
            setFormData({
                firstName: person.firstName,
                lastName: person.lastName,
                bio: person.bio,
                birthDate: person.birthDate,
            });
            setMediaItems([]); // Limpa mídia anterior
            setIsEditing(false);
            setActiveTab('bio');

            // Carregar media items e dados frescos se tivermos ID
            if (person.id) {
                loadPersonDetails(person.id);
            }
        }
    }, [person]);

    const loadPersonDetails = async (id: string) => {
        try {
            const response = await api.get(`/people/${id}`);
            const realData = response.data;

            // Mapeia snake_case do backend para camelCase do frontend se necessário,
            // mas se o backend retorna conforme o model SQLModel e o frontend Person espera camelCase,
            // precisamos ajustar. Pelo seed.py, os campos no DB são first_name.
            // O SQLModel serializa como definido. Vamos checar o retorno no network tab se possível.
            // Assumindo que o `PersonRead` mantem snake_case, precisamos mapear.
            // Ou melhor, vamos assumir que o frontend adapta ou backend envia camelCase (via alias).
            // Como não configurei alias, virá snake_case.

            const mappedPerson: Person = {
                id: realData.id.toString(),
                firstName: realData.first_name,
                lastName: realData.last_name,
                gender: realData.gender,
                birthDate: realData.birth_date,
                deathDate: realData.death_date,
                bio: realData.bio,
                photoUrl: realData.photo_url,
                fatherId: realData.father_id?.toString(),
                motherId: realData.mother_id?.toString(),
                // media items vem como media_items
            };

            setCurrentPerson(mappedPerson);
            setMediaItems(realData.media_items || []);

            setFormData({
                firstName: mappedPerson.firstName,
                lastName: mappedPerson.lastName,
                bio: mappedPerson.bio,
                birthDate: mappedPerson.birthDate,
                fatherId: mappedPerson.fatherId, // Include in form state
                motherId: mappedPerson.motherId,
            });
        } catch (e) {
            console.error("Erro ao carregar detalhes", e);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !person?.id) return;

        try {
            // Feedback simples de loading poderia ser melhorado
            const result = await uploadMedia(person.id, file);
            await loadPersonDetails(person.id);
            alert("Upload concluído!");
        } catch (error) {
            console.error(error);
            alert("Erro no upload.");
        }
    };

    const handleSave = async () => {
        if (!person?.id) return;
        try {
            setIsLoading(true);
            // O updatePerson espera Partial<Person>, mas backend espera snake_case (PersonUpdate)
            // Precisamos mapear de volta para snake_case no service ou aqui.
            // O service apenas repassa. O endpoint update espera PersonUpdate.

            // Payload snake_case para backend
            // Convert empty strings to null for IDs
            const payload = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                bio: formData.bio,
                birth_date: formData.birthDate,
                father_id: formData.fatherId ? parseInt(formData.fatherId as string) : null,
                mother_id: formData.motherId ? parseInt(formData.motherId as string) : null,
            };

            await api.patch(`/people/${person.id}`, payload);

            await loadPersonDetails(person.id);
            setIsEditing(false);
            // Alert user to refresh tree to see visual connection changes
            if (formData.fatherId !== currentPerson?.fatherId || formData.motherId !== currentPerson?.motherId) {
                alert("Relações atualizadas! Recarregue a página para atualizar as linhas da árvore.");
            }
        } catch (error) {
            console.error("Erro ao atualizar", error);
            alert("Erro ao salvar alterações.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !currentPerson) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-card shadow-2xl border-l border-border transform transition-transform z-50 flex flex-col">
            {/* Header */}
            <div className="relative h-48 bg-gradient-to-b from-primary/20 to-card">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-card-foreground transition"
                >
                    <X size={20} />
                </button>

                {/* Edit Button */}
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="absolute top-4 right-14 p-2 rounded-full bg-black/20 hover:bg-black/30 text-card-foreground transition"
                        title="Editar Perfil"
                    >
                        <Edit2 size={16} />
                    </button>
                )}

                <div className="absolute -bottom-12 left-8">
                    {currentPerson.photoUrl ? (
                        <img
                            src={currentPerson.photoUrl}
                            alt={`${currentPerson.firstName} ${currentPerson.lastName}`}
                            className="w-24 h-24 rounded-full border-4 border-card object-cover shadow-lg"
                        />
                    ) : (
                        <div className={`w-24 h-24 rounded-full border-4 border-card flex items-center justify-center text-3xl font-bold text-white shadow-lg
              ${currentPerson.gender === 'male' ? 'bg-blue-500' : currentPerson.gender === 'female' ? 'bg-rose-500' : 'bg-gray-500'}`}>
                            {currentPerson.firstName[0]}
                        </div>
                    )}
                </div>
            </div>

            {/* Info Body */}
            <div className="mt-14 px-8 flex-1 overflow-y-auto">

                {isEditing ? (
                    <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-muted-foreground">Nome</label>
                                <input
                                    value={formData.firstName || ''}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full p-2 rounded border border-border bg-background"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Sobrenome</label>
                                <input
                                    value={formData.lastName || ''}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full p-2 rounded border border-border bg-background"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">Data Nascimento</label>
                            <input
                                type="date"
                                value={formData.birthDate || ''}
                                onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                className="w-full p-2 rounded border border-border bg-background"
                            />
                        </div>

                        <div className="border-t border-border pt-4">
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Relacionamentos (IDs)</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-muted-foreground">ID do Pai</label>
                                    <input
                                        type="number"
                                        value={formData.fatherId || ''}
                                        onChange={e => setFormData({ ...formData, fatherId: e.target.value })}
                                        className="w-full p-2 rounded border border-border bg-background"
                                        placeholder="ID vazio"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">ID da Mãe</label>
                                    <input
                                        type="number"
                                        value={formData.motherId || ''}
                                        onChange={e => setFormData({ ...formData, motherId: e.target.value })}
                                        className="w-full p-2 rounded border border-border bg-background"
                                        placeholder="ID vazio"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Conecte a pessoas existentes digitando os IDs delas.</p>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="flex-1 bg-primary text-primary-foreground py-2 rounded flex items-center justify-center gap-2 hover:bg-primary/90"
                            >
                                <Save size={16} /> {isLoading ? "Salvando..." : "Salvar"}
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 bg-muted text-muted-foreground py-2 rounded flex items-center justify-center gap-2 hover:bg-muted/80"
                            >
                                <XCircle size={16} /> Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-card-foreground">
                            {currentPerson.firstName} {currentPerson.lastName}
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            {(formData.birthDate || currentPerson.birthDate) && (
                                <span className="flex items-center gap-1">
                                    <Calendar size={14} /> Nascido em {formData.birthDate || currentPerson.birthDate}
                                </span>
                            )}
                        </p>
                    </>
                )}

                {/* Tabs */}
                <div className="flex border-b border-border mb-6">
                    <button
                        onClick={() => setActiveTab('bio')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'bio' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Biografia
                    </button>
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'media' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Mídia ({mediaItems.length})
                    </button>
                </div>

                {activeTab === 'bio' ? (
                    <div className="space-y-6">
                        <div>
                            <h3 className="section-title text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sobre</h3>
                            {isEditing ? (
                                <textarea
                                    value={formData.bio || ''}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full h-32 p-2 rounded border border-border bg-background resize-none"
                                    placeholder="Escreva a biografia..."
                                />
                            ) : (
                                <p className="text-card-foreground leading-relaxed whitespace-pre-wrap">
                                    {currentPerson.bio || "Nenhuma biografia disponível ainda. Use a IA para gerar um resumo da vida desta pessoa baseada em suas memórias e documentos."}
                                </p>
                            )}
                        </div>

                        {!isEditing && (
                            <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <Heart size={16} className="text-primary" /> Família Imediata
                                </h4>
                                <ul className="space-y-1 text-sm">
                                    <li>
                                        <span className="text-muted-foreground mr-1">Pai:</span>
                                        {currentPerson.fatherId ? (
                                            <span className="text-foreground font-medium">ID {currentPerson.fatherId}</span>
                                        ) : <span className="text-muted-foreground italic">Desconhecido</span>}
                                    </li>
                                    <li>
                                        <span className="text-muted-foreground mr-1">Mãe:</span>
                                        {currentPerson.motherId ? (
                                            <span className="text-foreground font-medium">ID {currentPerson.motherId}</span>
                                        ) : <span className="text-muted-foreground italic">Desconhecida</span>}
                                    </li>
                                    {/* Futuro: Listar filhos e irmãos aqui buscando reversamente ou via array pre-carregado */}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileUpload}
                        />
                        <MediaGallery
                            items={mediaItems}
                            onUpload={() => fileInputRef.current?.click()}
                        />
                    </>
                )}

            </div>

            {/* Footer / Actions */}
            <div className="p-4 border-t border-border bg-muted/30">
                <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition shadow-sm">
                    ✨ Gerar Resumo com IA
                </button>
            </div>
        </div>
    );
};

export default ProfileDrawer;
