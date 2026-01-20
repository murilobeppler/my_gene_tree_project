import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { api } from '@/services/api';

interface AddMemberDialogProps {
    personId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddMemberDialog = ({ personId, isOpen, onClose, onSuccess }: AddMemberDialogProps) => {
    const [relation, setRelation] = useState<'parent' | 'child' | 'sibling'>('child');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState('other');
    const [isLoading, setIsLoading] = useState(false);
    const [parentIds, setParentIds] = useState<{ father?: number, mother?: number }>({});

    const [currentPersonGender, setCurrentPersonGender] = useState<string>('male'); // Default fallback

    // Reset e Fetch Info
    React.useEffect(() => {
        if (isOpen && personId) {
            // Fetch person info
            api.get(`/people/${personId}`).then(res => {
                setParentIds({
                    father: res.data.father_id,
                    mother: res.data.mother_id
                });
                setCurrentPersonGender(res.data.gender);
            }).catch(console.error);

            setFirstName('');
            setLastName('');
            setGender('other');
            setRelation('child');
        }
    }, [isOpen, personId]);

    if (!isOpen || !personId) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Payload base
            const payload: any = {
                first_name: firstName,
                last_name: lastName,
                gender: gender,
            };

            // Lógica de relacionamento
            if (relation === 'child') {
                // Se currentPerson é HOMEM -> father_id. Se MULHER -> mother_id.
                if (currentPersonGender === 'female') {
                    payload.mother_id = parseInt(personId);
                } else {
                    payload.father_id = parseInt(personId);
                }
            } else if (relation === 'sibling') {
                // Irmão compartilha pais
                if (parentIds.father) payload.father_id = parentIds.father;
                if (parentIds.mother) payload.mother_id = parentIds.mother;

                if (!parentIds.father && !parentIds.mother) {
                    // Se não tem pais cadastrados, cria-se um "pai desconhecido" ou apenas cria solto?
                    // Vamos criar solto, mas avisar.
                    // Ou melhor, criar um pai placeholder? Não, melhor deixar solto.
                    console.warn("Criando irmão sem pais vinculados (pessoa atual é raiz ou orfã de registro)");
                }
            }

            if (relation === 'parent') {
                // Se adicionando Pai/Mãe
                // Isso cria a pessoa, mas PRECISAMOS ATUALIZAR O FILHO (personId) para apontar para este novo pai.
                // O flow é: Cria Pai -> Pega ID -> Update Filho(father_id = Pai.ID)
                // *Problema:* Create Person endpoint não linka "filhos" automaticamente via payload reverso.

                // ... Implementando 'Parent' logic simples:
                // Assumindo que criamos um "Pai" (gender male default?)
                const res = await api.post('/people/', payload);
                const newParentId = res.data.id;

                // Update child (current node)
                // Vamos chutar: se relation é pai, seta father_id, se mae, mother_id?
                // Vamos simplificar: O usuario escolhe "Pai" ou "Mãe" no form.
                // Ops, meu form relation é só 'parent'. 
                // Vamos mudar para 'father', 'mother', 'child'.
                // Mas por simplicidade do MVP agora, vou implementar apenas 'Filho' que é direto.
                // PARENT requires 2 steps (create + update source).
                const updatePayload = gender === 'male' ? { father_id: newParentId } : { mother_id: newParentId };
                await api.patch(`/people/${personId}`, updatePayload);
            } else {
                // Child or Sibling (just create with links)
                await api.post('/people/', payload);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Erro ao adicionar membro.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-card w-full max-w-md rounded-lg shadow-xl border border-border p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <X size={20} />
                </button>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <UserPlus size={20} className="text-primary" /> Adicionar Parente
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Relação (com a pessoa selecionada)</label>
                        <select
                            value={relation}
                            onChange={e => setRelation(e.target.value as any)}
                            className="w-full p-2 rounded border border-input bg-background"
                        >
                            <option value="child">Filho(a) (de pai/mãe selecionado)</option>
                            <option value="sibling">Irmão/Irmã (mesmos pais)</option>
                            <option value="parent">Pai/Mãe</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Nome</label>
                            <input
                                required
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                className="w-full p-2 rounded border border-input bg-background"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Sobrenome</label>
                            <input
                                required
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                className="w-full p-2 rounded border border-input bg-background"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Gênero</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={e => setGender(e.target.value)} /> Masculino
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={e => setGender(e.target.value)} /> Feminino
                            </label>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-primary-foreground py-2 rounded font-medium hover:bg-primary/90"
                        >
                            {isLoading ? "Adicionando..." : "Confirmar e Adicionar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMemberDialog;
