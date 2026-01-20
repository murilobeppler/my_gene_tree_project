import React from 'react';
import { User, Tag, Image as ImageIcon, Film, XCircle, X } from 'lucide-react';
import { api } from '@/services/api';

interface MediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    title?: string;
    person_id?: string; // Added for context of setting profile pic for a specific person
    tagged_people?: { id: string; first_name: string; last_name: string }[]; // Added for displaying tagged people
}

interface MediaGalleryProps {
    items?: MediaItem[];
    onUpload?: () => void;
}

const MediaGallery = ({ items = [], onUpload }: MediaGalleryProps) => {
    const [selectedItem, setSelectedItem] = React.useState<MediaItem | null>(null);
    const [isTagging, setIsTagging] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<any[]>([]);

    const handleSetProfilePic = async (media: Partial<MediaItem>) => {
        if (!media.person_id) {
            alert("Esta mídia não está associada a uma pessoa para definir como foto de perfil.");
            return;
        }
        try {
            // Se URL vazia for passada, backend deve aceitar null ou string vazia para limpar
            await api.patch(`/people/${media.person_id}`, { photo_url: media.url || null });
            alert(media.url ? "Foto de perfil atualizada!" : "Foto de perfil removida!");
            setSelectedItem(null);
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("Erro ao atualizar foto.");
        }
    };

    // Efeito para busca
    React.useEffect(() => {
        if (searchQuery.length > 2) {
            const delayDebounceFn = setTimeout(() => {
                api.get(`/people/?search=${searchQuery}`).then((res) => {
                    setSearchResults(res.data);
                });
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const handleSelectPersonToTag = async (personId: string) => {
        if (!selectedItem) return;
        try {
            await api.post(`/media/${selectedItem.id}/tag/${personId}`);
            alert("Pessoa marcada!");
            setIsTagging(false);
            setSearchQuery('');
            setSearchResults([]);
            setSelectedItem(null); // Fecha modal ou reload tags? Ideal reload.
        } catch (e) {
            console.error(e);
            alert("Erro ao marcar pessoa.");
        }
    };

    const handleRemoveTag = async (personId: string) => {
        if (!selectedItem) return;
        try {
            await api.delete(`/media/${selectedItem.id}/tag/${personId}`);
            alert("Marcação removida!");
            // Quick Update State (Optimistic or Reload)
            setSelectedItem({
                ...selectedItem,
                tagged_people: selectedItem.tagged_people?.filter((p: any) => p.id !== personId)
            });
        } catch (e) {
            console.error(e);
            alert("Erro ao remover marcação.");
        }
    };

    const handleCloseModal = () => {
        setSelectedItem(null);
        setIsTagging(false);
        setSearchQuery('');
    }

    const handleTagPerson = () => {
        setIsTagging(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Galeria de Memórias
                </h3>
                <button
                    onClick={onUpload}
                    className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-opacity-90 transition"
                >
                    Adicionar Mídia
                </button>
            </div>

            {items.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center text-muted-foreground">
                    <p>Nenhuma memória adicionada ainda.</p>
                    <p className="text-sm mt-1">Clique em "Adicionar Mídia" para começar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="relative aspect-square rounded-md overflow-hidden bg-muted group cursor-pointer"
                        >
                            {item.type === 'video' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition">
                                    <Film className="w-8 h-8 text-white opacity-80" />
                                </div>
                            )}
                            <img
                                src={item.type === 'video' ? 'https://via.placeholder.com/150?text=Video' : item.url}
                                alt={item.title || 'Midia da família'}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            {/* Tags Indicator */}
                            {item.tagged_people && item.tagged_people.length > 0 && (
                                <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 rounded flex items-center gap-1">
                                    <Tag size={10} /> {item.tagged_people.length}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox / Details Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-2xl rounded-lg overflow-hidden flex flex-col md:flex-row max-h-[80vh]">
                        <div className="flex-1 bg-black flex items-center justify-center relative">
                            <img
                                src={selectedItem.url}
                                className="max-w-full max-h-full object-contain"
                                alt={selectedItem.title || 'Midia da família'}
                            />
                        </div>
                        <div className="w-full md:w-64 p-4 border-l border-border bg-card overflow-y-auto">
                            <h3 className="font-bold mb-4">Detalhes da Mídia</h3>

                            <div className="space-y-4">
                                {!isTagging ? (
                                    <>
                                        <button
                                            onClick={() => handleSetProfilePic(selectedItem)}
                                            className="w-full flex items-center gap-2 text-sm bg-secondary p-2 rounded hover:bg-secondary/80"
                                        >
                                            <User size={16} /> Definir como Perfil
                                        </button>
                                        <button
                                            onClick={() => handleSetProfilePic({ ...selectedItem, url: '' })}
                                            className="w-full flex items-center gap-2 text-sm bg-destructive/10 text-destructive p-2 rounded hover:bg-destructive/20"
                                        >
                                            <XCircle size={16} /> Remover Foto de Perfil
                                        </button>
                                        <button
                                            onClick={() => setIsTagging(true)}
                                            className="w-full flex items-center gap-2 text-sm bg-secondary p-2 rounded hover:bg-secondary/80"
                                        >
                                            <Tag size={16} /> Marcar Pessoa (@)
                                        </button>
                                    </>
                                ) : (
                                    <div className="bg-background border border-border rounded p-2 animate-in fade-in zoom-in">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold uppercase">Quem está na foto?</span>
                                            <button onClick={() => setIsTagging(false)}><Tag size={14} className="text-muted-foreground" /></button>
                                        </div>
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Buscar nome..."
                                            className="w-full text-sm p-1 rounded border border-input bg-transparent mb-2"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <ul className="max-h-32 overflow-y-auto space-y-1">
                                            {searchResults.map(p => (
                                                <li
                                                    key={p.id}
                                                    onClick={() => handleSelectPersonToTag(p.id)}
                                                    className="text-sm p-1 hover:bg-muted cursor-pointer rounded flex items-center gap-2"
                                                >
                                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">{p.first_name[0]}</div>
                                                    {p.first_name} {p.last_name}
                                                </li>
                                            ))}
                                            {searchQuery.length > 2 && searchResults.length === 0 && (
                                                <li className="text-xs text-muted-foreground p-1">Ninguém encontrado.</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6">
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Marcados nesta foto</h4>
                                {selectedItem.tagged_people && selectedItem.tagged_people.length > 0 ? (
                                    <ul className="space-y-1">
                                        {selectedItem.tagged_people.map((p: any) => (
                                            <li key={p.id} className="text-sm flex items-center justify-between group/tag bg-muted/50 p-1 rounded">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">
                                                        {p.first_name[0]} {p.last_name && p.last_name[0]}
                                                    </div>
                                                    {p.first_name} {p.last_name}
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveTag(p.id)}
                                                    className="opacity-0 group-hover/tag:opacity-100 text-muted-foreground hover:text-destructive transition-opacity px-1"
                                                    title="Remover marcação"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Ninguém marcado.</p>
                                )}
                            </div>

                            <button
                                onClick={handleCloseModal}
                                className="mt-8 text-sm text-muted-foreground underline w-full"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaGallery;
